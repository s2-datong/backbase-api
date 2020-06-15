const config = require('../../config');
const url = config.service.job_scheduler.url;
const axios = require('axios');

class JobSchedulerService{
    static async addJob(org_id, job_id, queue, intervalObj){
        const job = {
            id: job_id,
            q: queue,
            ...intervalObj
        };
        try{
            await axios.post(`${url}/${org_id}`, job, {
                headers: {
                    'Content-type': 'application/json'
                }
            });
        }
        catch(e){
            // TODO: log to sentry
        }
    }

    static async updateJob(org_id, job_id, queue, intervalObj){
        const job = {
            id: job_id,
            q: queue,
            ...intervalObj
        };
        try{
            await axios.put(`${url}/${org_id}`, job, {
                headers: {
                    'Content-type': 'application/json'
                }
            });
        }
        catch(e){
            // TODO: log to sentry
        }
    }

    static async deleteJob(org_id, job_id){
        try{
            await axios.delete(`${url}/${org_id}/${job_id}`);
        }
        catch(e){
            // TODO: log to sentry
        }
    }
}

module.exports = JobSchedulerService;