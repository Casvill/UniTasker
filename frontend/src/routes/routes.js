import React from "react";

const Dashboard = React.lazy(() => import("../views/home"));

const routes = [
  { path: "/", name: "Home", element: Home },
];

export default routes;