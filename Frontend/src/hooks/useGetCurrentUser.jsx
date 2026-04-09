import { getCurrentUser } from "@/api/getUser";
import React from "react";
import { useDispatch } from "react-redux";

export default function useGetCurrentUser() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getCurrentUser());
  }, []);
}
