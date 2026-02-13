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

    const endCall = async (data) => {
        const {user_id, call_id,participant_count,call_title,participant,time,duration} = data
        try {
            setIsLoading(true)
            setError(null)
            console.log(data)

            const res = await api.post("/calls/end", {user_id, call_id,participant_count,call_title,participant,time,duration})
            if (res.status === 200) {
                setIsLoading(false)
                setError(null)
                useCallStore.setState({ callLogs: res.data.callLogs })
                toast.success("Call ended successfully")
                return res.data // Return data so the caller can use it
            }
        } catch (error) {
             setIsLoading(false)
            setError(error.response?.data?.error || "Failed to end call")
            console.log(error.response?.data?.error)
            toast.error(error.response?.data?.error || "Failed to end call")
           }
        
    }

    const fetchCallLogs = async (userId) => {
        try {
            setIsLoading(true)
            setError(null)
            const res = await api.get(`/calls/logs/${userId}`)
            if (res.status === 200) {
                useCallStore.setState({ callLogs: res.data.call_logs || [] })
            }
        } catch (error) {
            console.error("Fetch call logs error:", error)
            setError(error.response?.data?.error || "Failed to fetch call logs")
            toast.error(error.response?.data?.error || "Failed to fetch call logs")
        } finally {
            setIsLoading(false)
        }
    }
    
    return {
        createCallLink,
        listCalls,
        findCallByLink,
        isLoading,
        error,
        endCall,
        fetchCallLogs
    }
}

export default useCall;