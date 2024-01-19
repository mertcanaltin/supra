import { Http } from './http';
import { ClientResponse, HttpRequestOptions, RequestOptions } from './types';
import CircuitBreaker from 'opossum';
import { CONTENT_TYPE } from './enums';

(CircuitBreaker as any) = require('../opossum-state-fixed');

class Client {
  private http: Http;
  static circuits: Map<string, CircuitBreaker<any, ClientResponse>> = new Map();

  constructor(http: Http) {
    this.http = http;
  }

  request(name: string, url: string, options?: RequestOptions): Promise<ClientResponse> {
    const circuit = Client.circuits.get(name) || this.createCircuit(name, options as any);

    return circuit.fire(url, options || {});
  }

  private async requestSender(url: string, requestOptions: HttpRequestOptions): Promise<ClientResponse> {
    const res = await this.http.request(url, requestOptions);
    if (requestOptions && requestOptions.json && res.body && res.response.headers['content-type'] && res.response.headers['content-type'].startsWith(CONTENT_TYPE.ApplicationJson)) {
      res.json = JSON.parse(res.body);
    }
    return res;
  }

  private createCircuit(name: string, options: RequestOptions): CircuitBreaker<any, ClientResponse> {
    const circuit = new CircuitBreaker(this.requestSender.bind(this), { name, ...options });
    Client.circuits.set(name, circuit);
    return circuit;
  }
}

export { Client };
