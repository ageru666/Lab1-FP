import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    cloud: {
        projectID: 3723776, 
        name: 'Ramping VUs Test'
    },
    stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '3m', target: 30 },
    ],
};

export default function () {
    http.get('http://localhost:8080/products/');
    sleep(Math.random() * 3 + 1);
}