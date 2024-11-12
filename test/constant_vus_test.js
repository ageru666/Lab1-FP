import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    cloud: {
        projectID: 3723776, 
        name: 'Constant VUs Test'
    },
    stages: [
        { duration: '1m', target: 10 },
    ],
};

export default function () {
    http.get('http://localhost:8080/products/');
    sleep(Math.random() * 3 + 1);
}
