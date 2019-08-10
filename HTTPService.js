const axiosConfig = {
  baseURL: url,
  timeout: 20000,
  method: 'get'
}

const HTTPService = (url) => axios.create({
  ...axiosConfig,
  baseURL: url,
});

export default HTTPService;