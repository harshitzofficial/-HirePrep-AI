import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
})


/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {

    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)
    formData.append("resume", resumeFile)

    const response = await api.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })

    return response.data

}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)

    return response.data
}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")

    return response.data
}


/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}

export const searchLiveJobs = async (location) => {
    const response = await api.get(`/api/jobs/search?location=${location}`);
    return response.data;
};


// Change these to include /api
export const getLiveQuestions = async (data) => {
    const response = await api.post('/api/interview/live/questions', data); // Added /api
    return response.data;
};

export const evaluateInterview = async (data) => {
    const response = await api.post('/api/interview/live/evaluate', data); // Added /api
    return response.data;
};


export const evaluateSingleAnswer = async (payload) => {
    // ✅ FIX: Use the "api" instance so it hits localhost:3000 and sends cookies
    const response = await api.post("/api/interview/live/evaluate-single", payload);
    return response.data;
};


export const generateDynamicRoadmap = async (payload) => {
    // payload will contain: { jobDescription, resumeText, days }
    const response = await api.post("/api/interview/roadmap/dynamic", payload);
    return response.data;
};