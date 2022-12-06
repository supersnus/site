import { useEffect, useState } from "react"
import axios from "axios"

import { Spinner } from "../components/Spinner"


export const usePostData = (url = "", data = "") => {

    const [value, setValue] = useState([])

    useEffect(() => {
        const fetchData = async () => {

            const response = await axios.post(url, data)

            setValue(await response.data)
        }
        fetchData()
    }, [url])

    return { value, Spinner }
}

export const useGetData = (url = "") => {

    const [value, setValue] = useState([])

    useEffect(() => {
        const fetchData = async () => {

            const response = await axios.get(url)

            setValue(await response.data)
        }
        fetchData()
    }, [url])

    return { value, Spinner }
}