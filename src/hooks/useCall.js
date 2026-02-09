import { useState } from "react"
import api from "../lib/axios"
import {toast} from "react-hot-toast"
import useCallStore from "../store/CallStore"


const useCall = () => {

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    
    const listCalls = async () => {
       // if (!hostId) return;
        try {
            setIsLoading(true)
            setError(null)
            const res = await api.get(`/calls/`)
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

    return {
        createCallLink,
        listCalls,
        isLoading,
        error
    }
}

export default useCall;