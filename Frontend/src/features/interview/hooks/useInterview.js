import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "@features/interview/services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "@features/interview/contexts/interview.context"
import { useParams } from "react-router"
import toast from 'react-hot-toast';

export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            
            // Safe check to ensure we actually got data back
            if (response && response.interviewReport) {
                setReport(response.interviewReport)
                return response.interviewReport
            }
        } catch (error) {
            // 🚨 Catch the Rate Limit Error
            if (error.response?.status === 429) {
                toast.error("⏳ You've hit the AI generation limit! Please wait 15 minutes.", { duration: 5000 });
            } else {
                console.error("Failed to generate report:", error)
                toast.error("Something went wrong while generating the report. Please try again.");
            }
        } finally {
            setLoading(false)
        }
        return null; // Safe fallback if it fails
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        try {
            const response = await getInterviewReportById(interviewId)
            
            if (response && response.interviewReport) {
                setReport(response.interviewReport)
                return response.interviewReport
            }
        } catch (error) {
            console.error("Failed to fetch report by ID:", error)
        } finally {
            setLoading(false)
        }
        return null; // Safe fallback
    }

    const getReports = async () => {
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            
            if (response && response.interviewReports) {
                setReports(response.interviewReports)
                return response.interviewReports
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error)
        } finally {
            setLoading(false)
        }
        return []; // Safe fallback to an empty array so .map() doesn't crash elsewhere!
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            const response = await generateResumePdf({ interviewReportId })
            
            if (response) {
                const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
                const link = document.createElement("a")
                link.href = url
                link.setAttribute("download", `resume_${interviewReportId}.pdf`)
                document.body.appendChild(link)
                link.click()
                window.URL.revokeObjectURL(url) // Clean up
            }
        } catch (error) {
            // 🚨 PDF generation uses Gemini for HTML, so it can also hit the rate limit!
            if (error.response?.status === 429) {
                toast.error("⏳ You've hit the AI generation limit! Please wait 15 minutes before downloading a new AI resume.", { duration: 5000 });
            } else {
                console.error("Failed to generate PDF:", error)
                toast.error("Failed to download the resume. Please try again later.");
            }
        } finally {
            setLoading(false)
        }
    }

    const previewResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            const response = await generateResumePdf({ interviewReportId })
            
            if (response) {
                const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
                return { url, filename: `resume_${interviewReportId}.pdf` }
            }
        } catch (error) {
            if (error.response && error.response.status === 429) {
                alert("⏳ You've hit the AI generation limit! Please wait 15 minutes.");
            } else {
                console.error("Failed to generate PDF preview:", error)
                alert("Failed to preview the resume. Please try again later.");
            }
            return null
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ interviewId ])

    return { loading, report, reports, setReports, generateReport, getReportById, getReports, getResumePdf, previewResumePdf }

}