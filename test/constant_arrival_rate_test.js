import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    scenarios: {
        constant_rate: {
            executor: 'constant-arrival-rate',
            rate: 20,
            timeUnit: '1s',
            duration: '1m',
            preAllocatedVUs: 50,
            maxVUs: 100,
        },
    },
};

export default function () {
    http.get('http://localhost:8080/external-api/');
    sleep(Math.random() * 3 + 1);
}
