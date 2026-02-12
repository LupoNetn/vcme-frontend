import { useState } from "react"
import api from "../lib/axios"
import {toast} from "react-hot-toast"
import useCallStore from "../store/CallStore"


const useCall = () => {

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    
    const listCalls = async (hostId) => {
        try {
            setIsLoading(true)
            setError(null)
            const url = hostId ? `/calls/${hostId}` : `/calls/`
            const res = await api.get(url)
            if (res.status === 200) {
                useCallStore.setState({
                    userCalls: res.data.calls || []
                })
            }
        } catch (error) {
            console.error("List calls error:", error)
            setError(error.response?.data?.error || "Failed to fetch calls")
            toast.error(error.response?.data?.error || "Failed to fetch calls")
        } finally {
            setIsLoading(false)
        }
    }

    const createCallLink = async (data) => {
        const { title, description, host_id } = data
        try {
            setIsLoading(true)
            setError(null)

            const res = await api.post("/calls/", { title, description, host_id })
            if (res.status === 200) {
                setIsLoading(false)
                setError(null)
                // Refresh the calls list after creation
                await listCalls(host_id)
                toast.success("Call created successfully")
            }    
        } catch (error) {
            setIsLoading(false)
            setError(error.response?.data?.error || "Failed to create call")
            toast.error(error.response?.data?.error || "Failed to create call")
        }
    }

    const findCallByLink = async (link) => {
        try {
            setIsLoading(true)
            const res = await api.get(`/calls/link/${link}`)
            return res.data.call
        } catch (error) {
            console.error("Find call error:", error)
            return null
        } finally {
            setIsLoading(false)
        }
    }

    return {
        createCallLink,
        listCalls,
        findCallByLink,
        isLoading,
        error
    }
}

export default useCall;