import { InstantiateResult } from "@cosmjs/cosmwasm-stargate";
import { calculateFee, Coin } from "@cosmjs/stargate";
import React from "react";
import JSONInput from "react-json-editor-ajrm";
import { ContractLink } from "../../components/ContractLink";
import { TransactionLink } from "../../components/TransactionLink";

import { ClientContext } from "../../contexts/ClientContext";
import { settings } from "../../settings";
import { jsonInputStyle } from "../../ui-utils/jsonInput";
import { Result } from "./ContractPage";

const executePlaceholder = {
  name: "Nation coin",
  symbol: "NTN",
  decimals: 6,
};

const coinsPlaceholder = [{ denom: settings.backend.denominations[0], amount: "1" }];

interface Props {
  readonly codeId: number;
}

export function InstantiationContract({ codeId }: Props): JSX.Element {
  const { userAddress, signingClient } = React.useContext(ClientContext);

  const [executing, setExecuting] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const [memo, setMemo] = React.useState<string>();
  const [label, setLabel] = React.useState<string>();

  const [msgObject, setMsgObject] = React.useState<Result<Record<string, any>>>();
  const [coinsObject, setCoinsObject] = React.useState<Result<ReadonlyArray<Coin>>>();

  const [executeResponse, setExecuteResponse] = React.useState<Result<InstantiateResult>>();

  React.useEffect(() => {
    setMsgObject({ result: executePlaceholder });
    setCoinsObject({ result: coinsPlaceholder });
  }, []);

  React.useEffect(() => {
    if (msgObject?.error) {
      setError(msgObject.error);
      return;
    }

    if (executeResponse?.error) {
      setError(executeResponse.error);
      return;
    }

    if (coinsObject?.error) {
      setError(coinsObject.error);
      return;
    }

    setError(undefined);
  }, [coinsObject, executeResponse, msgObject]);

  async function executeContract(): Promise<void> {
    if (!msgObject?.result || !userAddress || !label || !signingClient) return;

    setExecuting(true);

    try {
      const executeResponseResult: InstantiateResult = await signingClient.instantiate(
        userAddress,
        codeId,
        msgObject.result,
        label,
        calculateFee(600000, settings.backend.gasPrice),
        {
          memo: memo,
          funds: coinsObject?.result,
        },
      );
      setExecuteResponse({ result: executeResponseResult });
    } catch (error) {
      setExecuteResponse({ error: `Execute error: ${error.message}` });
    }

    setExecuting(false);
  }

  return (
    <div className="card mb-3">
      <ul className="list-group list-group-flush">
        <li className="list-group-item d-flex align-items-baseline">
          <span title="The contract query input">Instantiate contract:</span>
        </li>
        <li className="list-group-item d-flex align-items-baseline">
          <JSONInput
            width="100%"
            height="200px"
            placeholder={executePlaceholder}
            confirmGood={false}
            style={jsonInputStyle}
            onChange={({ jsObject }: any) => setMsgObject({ result: jsObject })}
          />
        </li>
        <li className="list-group-item d-flex align-items-baseline">
          <span title="The contract query input">Coins to transfer:</span>
        </li>
        <li className="list-group-item d-flex align-items-baseline">
          <JSONInput
            width="100%"
            height="120px"
            placeholder={coinsPlaceholder}
            confirmGood={false}
            style={jsonInputStyle}
            onChange={({ jsObject }: any) => setCoinsObject({ result: jsObject })}
          />
        </li>
        <li className="list-group-item d-flex align-items-baseline">
          <div className="form-group row flex-grow-1">
            <label className="col-sm-2 col-form-label">Label</label>
            <div className="col-sm-10">
              <input
                className="form-control"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </div>
          </div>
        </li>
        <li className="list-group-item d-flex align-items-baseline">
          <div className="form-group row flex-grow-1">
            <label className="col-sm-2 col-form-label">Memo</label>
            <div className="col-sm-10">
              <input
                className="form-control"
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
              />
            </div>
          </div>
        </li>
        <div className="list-group-item btn-group">
          {executing ? (
            <button className="btn btn-primary" type="button" disabled>
              <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
              Executing...
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={executeContract}
              disabled={!msgObject?.result || !signingClient}
            >
              Instantiate contract
            </button>
          )}
        </div>
        {executeResponse?.result ? (
          <>
            <li className="list-group-item">
              <span className="font-weight-bold">Response:</span>
            </li>
            <li className="list-group-item">
              <div className="row mb-3">
                <div className="col-md-3">
                  <span>Contract:</span>
                </div>
                <div className="col-md-9">
                  <ContractLink address={executeResponse.result.contractAddress} maxLength={99} />
                </div>
              </div>
              <div className="row">
                <div className="col-md-3">
                  <span>Transaction:</span>
                </div>
                <div className="col-md-9">
                  <TransactionLink transactionId={executeResponse.result.transactionHash} maxLength={40} />
                </div>
              </div>
            </li>
          </>
        ) : null}
        {error ? (
          <li className="list-group-item">
            <span className="text-danger" title="The contract query error">
              {error}
            </span>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
