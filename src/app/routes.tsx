import { createBrowserRouter } from "react-router";
import Home from "./components/Home";
import CustomerPage from "./components/CustomerPage";
import DeliveryPage from "./components/DeliveryPage";
import OrderTracking from "./components/OrderTracking";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/customer",
    Component: CustomerPage,
  },
  {
    path: "/delivery",
    Component: DeliveryPage,
  },
  {
    path: "/tracking",
    Component: OrderTracking,
  },
]);
