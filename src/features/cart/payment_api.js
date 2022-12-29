import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export const payment_api = createApi({
    reducerPath: "payment_api",
    baseQuery: fetchBaseQuery({
        baseUrl: `http://${process.env.PUBLIC_URL}/payment`,
        prepareHeaders: (headers) => {

            const token = localStorage.getItem("user");

            if (token) {
                headers.set('authorization', `Bearer ${token}`)
            }

            return headers
        },
    }),
    tagTypes: ['Payment'],
    endpoints: (builder) => ({
        getOrders: builder.query({
            query: () => "/get_orders",
        }),
        getLastUsersOpenOrder: builder.query({
            query: () => "/get_order",
        }),
        createOrder: builder.mutation({
            query: (data) => ({
                url: "/create_order",
                method: 'POST',
                body: { cart: data },
                responseType: "json",
            }),
            invalidatesTags: [{ type: 'Payment', id: 'LIST' }]
        }),
        updateOrder: builder.mutation({
            query: () => ({

            })
        })
    })
})

export const { useCreateOrderMutation, useGetOrdersQuery, useUpdateOrderMutation, useGetLastUsersOpenOrderQuery } = payment_api;
