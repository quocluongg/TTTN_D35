import { QueryClient } from "@tanstack/react-query";
import _ from "lodash";

// shared - configs
import { IS_SERVER } from "@/shared/configs/appConfig";

// create query client
// @ts-ignore
export function createQueryClient(options?) {
  return new QueryClient(
    _.defaultsDeep(options, {
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
          gcTime: 10000,
          // With SSR, we usually want to set some default staleTime
          // above 0 to avoid refetching immediately on the client
          staleTime: IS_SERVER ? 20000 : 1000, // 20 seconds
        },
      },
    })
  );
}

export default createQueryClient;
