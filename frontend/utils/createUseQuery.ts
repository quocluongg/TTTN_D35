"use client";

import { useCallback } from "react";
import { useAtomCallback } from "jotai/utils";
import { useQuery as useQueryBase } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import _ from "lodash";

type UseQueryParamType = {
  tableId?: string;
  queryParams?: any;
  queryOptions?: UseQueryOptions;
  onBeforeSetState?: any;
  onAfterSetState?: any;
  onSuccess?: any;
  queryKey?: any;
};

// standardize use query hook for CSR and SSR
// @ts-ignore
export const createUseQuery = ({
  // @ts-ignore
  queryKey: baseQueryKey,
  // @ts-ignore
  queryFn,
  setStateCallback = () => {},
}) => {
  // create new use query hook
  // - queryParams: overwrite queryFn params
  // - queryOptions: overwrite useQuery's options
  // - hooks
  //    + onBeforeSetState
  //    + onAfterSetState
  //    + onSuccess
  const useQuery = (options?: UseQueryParamType) => {
    const {
      tableId,
      queryParams = {},
      queryOptions = {},
      onBeforeSetState,
      onAfterSetState,
      onSuccess,
      queryKey: customQueryKey,
    } = options || {};
    const queryKey = customQueryKey ?? baseQueryKey;

    // -- state --
    const setState = useAtomCallback(setStateCallback);

    const query = useQueryBase({
      queryKey,
      queryFn: async () => {
        const res = await queryFn(queryParams);

        // call hook `onBeforeSetState`
        if (onBeforeSetState) {
          await onBeforeSetState(res);
        }

        // set state
        // @ts-ignore
        setState(res, { tableId, queryParams });

        // call hook `onAfterSetState`
        if (onAfterSetState) {
          await onAfterSetState(res);
        }

        // call hook `onSuccess`
        if (onSuccess) {
          await onSuccess(res);
        }

        // return response
        return res;
      },
      enabled: true,
      ...queryOptions,
    });

    // Fix: Pass an inline function to useCallback to avoid dependency warning
    const debouncedRefetch = useCallback(
      () => _.debounce(query.refetch, 400)(),
      [query.refetch]
    );

    return { ...query, debouncedRefetch };
  };

  // reassign params to use query hook
  useQuery.queryFn = queryFn;
  useQuery.setStateCallback = setStateCallback;

  return useQuery;
};

export default createUseQuery;
