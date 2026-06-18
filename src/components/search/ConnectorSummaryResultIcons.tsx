import querySuccessIcon from "../../assets/search/connector-query-success.png";
import partialErrorsIcon from "../../assets/search/connector-partial-errors.png";
import partialMaxIcon from "../../assets/search/connector-partial-max.png";

const RESULT_ICON_CLASS = "h-[18px] w-auto shrink-0";

export function ConnectorQuerySuccessIcon() {
  return <img src={querySuccessIcon} alt="" className={RESULT_ICON_CLASS} aria-hidden />;
}

export function ConnectorPartialErrorsIcon() {
  return <img src={partialErrorsIcon} alt="" className={RESULT_ICON_CLASS} aria-hidden />;
}

export function ConnectorPartialMaxIcon() {
  return <img src={partialMaxIcon} alt="" className={RESULT_ICON_CLASS} aria-hidden />;
}
