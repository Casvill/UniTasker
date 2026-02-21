import { Outlet } from "react-router-dom";

export default function DefaultLayout() {
  return (
    <div style={{ padding: 20 }}>
      <header>
        <h3>UniTasker</h3>
        <hr />
      </header>

      <Outlet />
    </div>
  );
}