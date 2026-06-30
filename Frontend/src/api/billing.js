import axios from "axios";

// Empty string => requests are same-origin relative (/api/...) and go
// through the Vite dev-server proxy, avoiding cert/CORS issues.
const BASE_URL = import.meta.env.VITE_BASE_URL || "";

export const createCheckoutSession = async ({ planType, billingPeriod }) => {
  const res = await axios.post(
    `${BASE_URL}/api/billing/checkout-session`,
    { planType, billingPeriod },
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    },
  );

  return res.data;
};

export const verifyCheckoutSession = async (sessionId) => {
  const res = await axios.get(`${BASE_URL}/api/billing/verify-session`, {
    params: { sessionId },
    withCredentials: true,
  });

  return res.data;
};
