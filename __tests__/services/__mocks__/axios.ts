
const instance = ({ url }: any) => {
    switch(url) {
        case "success": 
            return Promise.resolve({
                data: 'data-success'
            })
        case "error-message":
            return Promise.reject({
                message: 'error-message'
            })
        case "error-data":
            return Promise.reject({
                response: {
                    data: 'error-data'
                }
            })
        default: 
            return Promise.reject()
    }  
}

instance.defaults = {
    baseURL: null,
    headers: {
        Authorization: null
    }
}

export default {
    create: () => instance
}
