// @ts-nocheck

import { useAtom } from "jotai";
import { produce } from "immer";

// @shared - states
import createUseQuery from "./createUseQuery";
import { TablePaginationState } from "@/shared/states/TableState";
// @shared - utils

// standardize use pagination query hook for CSR and SSR
export const createUsePaginationQueryV2 = ({
  queryKey: baseQueryKey,
  queryFn,
  setStateCallback = () => {},
}) => {
  // create new use pagination query hook
  const usePaginationQuery = ({
    defaultPage = 1,
    defaultPageSize,
    queryParams = {},
    onSuccess,
    queryKey: customQueryKey,
    ...useQueryOptions
  } = {}) => {
    // -- internal state --
    const [pagination, setPagination] = useAtom(
      TablePaginationState({
        id: JSON.stringify(customQueryKey ?? baseQueryKey),
        defaultPage,
        defaultPageSize,
      })
    );
    const { page, pageSize, total } = pagination;

    const queryKey = [...(customQueryKey ?? baseQueryKey), page, pageSize];

    // query
    const useQuery = createUseQuery({
      queryKey,
      queryFn,
      setStateCallback,
    });
    const query = useQuery({
      queryParams: { page, pageSize, ...queryParams },
      onSuccess: (res) => {
        // update pagination based on response
        setPagination(
          produce((draft) => {
            draft.total = res.data.total;
          })
        );
        // call `onSuccess`
        onSuccess?.(res);
      },
      ...useQueryOptions,
    });

    // fetch with new page
    const fetchPage = (page) => {
      // set page state
      setPagination(
        produce((draft) => {
          draft.page = page;
        })
      );
    };

    // fetch with new page size
    const fetchPageSize = (pageSize) => {
      // set page size state
      setPagination(
        produce((draft) => {
          draft.page = 1; // reset to first page
          draft.pageSize = pageSize;
        })
      );
    };

    return { ...query, page, pageSize, total, fetchPage, fetchPageSize };
  };

  usePaginationQuery.queryFn = queryFn;
  usePaginationQuery.setStateCallback = setStateCallback;

  return usePaginationQuery;
};

export default createUsePaginationQueryV2;
