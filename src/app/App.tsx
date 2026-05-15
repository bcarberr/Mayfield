import { Route, Routes } from "react-router-dom";
import { ConfigSchemaMapPage } from "./ConfigSchemaMapPage";
import { SearchLandingPage } from "./SearchLandingPage";
import { ROUTES } from "./routes";

export function App() {
  return (
    <Routes>
      <Route path={ROUTES.schemaMap} element={<ConfigSchemaMapPage />} />
      <Route path={ROUTES.search} element={<SearchLandingPage />} />
    </Routes>
  );
}
