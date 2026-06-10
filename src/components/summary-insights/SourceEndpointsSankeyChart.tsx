import networkSankeyGraphic from "../../assets/network-top-source-endpoints-sankey.png?url";

/** Figma `1595:87315` — full frame is 1347×943; chart body starts below card title + rule (y≈77). */
const SANKEY_WIDTH = 1347;
const SANKEY_HEIGHT = 943;
const SANKEY_TITLE_BAR_PX = 77;
const SANKEY_CHART_HEIGHT = SANKEY_HEIGHT - SANKEY_TITLE_BAR_PX;

const IMAGE_LAYER_STYLE = {
  height: `${(SANKEY_HEIGHT / SANKEY_CHART_HEIGHT) * 100}%`,
  top: `${(-SANKEY_TITLE_BAR_PX / SANKEY_CHART_HEIGHT) * 100}%`,
};

/** Figma `1595:87315` — Top 15 Source Endpoints sankey (graphic only, title via `InsightCard`). */
export function SourceEndpointsSankeyChart() {
  return (
    <div className="relative w-full shrink-0 overflow-hidden">
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: `${SANKEY_WIDTH} / ${SANKEY_CHART_HEIGHT}` }}
      >
        <div className="absolute left-0 w-full" style={IMAGE_LAYER_STYLE}>
          <img
            src={networkSankeyGraphic}
            alt="Top 15 source endpoints sankey diagram showing traffic from source IPs through activity types and ports to destination IPs"
            className="block h-full w-full max-w-none"
          />
        </div>
      </div>
    </div>
  );
}
