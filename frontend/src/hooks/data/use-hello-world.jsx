import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";

const fetchHelloWorld = async () => {
  const { data } = await api.get("/");
  return data;
};

export const useHelloWorld = () => {
  return useQuery({
    queryKey: ["hello-world"],
    queryFn: fetchHelloWorld,
  });
};
