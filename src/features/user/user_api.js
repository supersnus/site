import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { Storage } from "../../hooks/Storage";

export const user_api = createApi({
    reducerPath: "user_api",
    baseQuery: fetchBaseQuery({
        baseUrl: `${process.env.API_URL}/auth`,
        prepareHeaders: (headers) => {

            const token = localStorage.getItem("user")
            console.log(token)

            if (token) {
                headers.set('authorization', `Bearer ${token}`)
            }

            return headers
        },
    }),
    tagTypes: ['User'],
    endpoints: (builder) => ({
        checkToken: builder.query({
            query: () => "/check_token",
            // providesTags: (result) =>
            //     result ? result.map(({ id }) => ({ type: 'User', id })) : [],
        }),
    })
})

export const { useCheckTokenQuery } = user_api;
