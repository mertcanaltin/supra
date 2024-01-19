import { request as undiciRequest, Agent } from 'undici';
import { Compression } from './compression';
import { ClientResponse, HttpRequestOptions } from './types';
import { CONTENT_TYPE } from './enums';
import Url from 'fast-url-parser';
import { stringify } from 'querystring';

class Http {
  async request(url: string, requestOptions: HttpRequestOptions): Promise<ClientResponse> {
    const agent = url.startsWith('https') ? new Agent : new Agent;

    
    
    const requestBody = typeof requestOptions.body === 'object'
      ? JSON.stringify(requestOptions.body)
      : typeof requestOptions.body === 'string'
      ? requestOptions.body
      : undefined;

    const requestFormContent = !requestBody
      ? typeof requestOptions.form === 'object'
        ? stringify(requestOptions.form as any)
        : typeof requestOptions.form === 'string'
        ? requestOptions.form
        : undefined
      : undefined;

    const options = this.createRequestOptions(url, requestOptions, agent, requestBody, requestFormContent);
    const requestProvider = {
      agent: options.protocol === 'https:' ? Agent : Agent,
      client: undiciRequest,
    };
    console.log('Requesting URL:', url);
    console.log('Options:', options);
    const { statusCode, headers, body } = await undiciRequest('http://localhost:4406/package-lock.json');
console.log(statusCode,'statusscode')
    const compressedBody = await new Promise<string>((resolve, reject) => {
      Compression.handle(body as any, (err, compressedBody) => {
        if (err) {
          reject(err);
        } else {
          resolve(compressedBody as any);
        }
      });
    }) as any;

    try {
      return {
        body: compressedBody,
        json: JSON.parse(compressedBody),
        response: {
          statusCode,
          headers,
        } as any,
      };
    } catch (jsonParseError) {
      return {
        body: compressedBody,
        json: JSON.parse(compressedBody),
        response: {
          statusCode,
          headers,
        } as any,
      };
    }
  }

  private createRequestOptions(
    targetUrl: string,
    options: HttpRequestOptions,
    agent: Agent,
    bodyContent?: string,
    formContent?: string
  ) {
    const url = Url.parse(targetUrl);

    const mergedOptions: any = {
      method: options.method || 'get',
agent,
      hostname: url.hostname,
      port: url.port,
      protocol: url._protocol + ':',
      path: url.pathname + (url.search || ''),
      headers: {
        ...options.headers,
        'accept-encoding': Compression.getSupportedStreams(),
      },
      body: bodyContent || formContent
    };

    if (typeof options.followRedirect === 'boolean') {
      mergedOptions.followRedirect = options.followRedirect;
    }

    if (options.httpTimeout) {
      mergedOptions.timeout = options.httpTimeout;
    }

    if (options.json || bodyContent) {
      mergedOptions.headers['content-type'] = CONTENT_TYPE.ApplicationJson;
    } else if (formContent) {
      mergedOptions.headers['content-type'] = CONTENT_TYPE.FormUrlEncoded;
    }

    return mergedOptions;
  }
}

export { Http };
