import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"

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
            if (error.response && error.response.status === 429) {
                alert("⏳ You've hit the AI generation limit! Please wait 15 minutes.");
            } else {
                console.error("Failed to generate report:", error)
                alert("Something went wrong while generating the report. Please try again.");
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
            }
        } catch (error) {
            // 🚨 PDF generation uses Gemini for HTML, so it can also hit the rate limit!
            if (error.response && error.response.status === 429) {
                alert("⏳ You've hit the AI generation limit! Please wait 15 minutes before downloading a new AI resume.");
            } else {
                console.error("Failed to generate PDF:", error)
                alert("Failed to download the resume. Please try again later.");
            }
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
    }, [ interviewId ])

    return { loading, report, reports, setReports, generateReport, getReportById, getReports, getResumePdf }

}