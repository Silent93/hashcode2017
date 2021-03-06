import fs = require('fs');

import { Promise } from 'es6-promise';

export const INPUT_KITTENS = 'input/kittens.in';
export const EXAMPLE = 'input/example.in';

export interface FileStructure {
    videoCount: number;
    endpointCount: number;
    requestDescriptionCount: number;
    cacheCount: number;
    cacheSizes: number[];
    videoSizes: number[];
    endpoints: Endpoint[];
    endpointRequests: EndpointRequest[];
}

export interface EndpointRequest {
    count: number;
    videoNumber: number;
    endpoint: number;
}

export interface Endpoint {
    dataCenterLatency: number;
    // array index refers to cache index
    cacheCount: number;
    connectedCacheLatencies: number[];
}

export class _InputService {

    public read(filename: string): Promise<FileStructure> {
        var currentLineNumber = 0;
        var currentlyEndpointDescription = false;
        var nextNLinesAreEndpointCacheDescriptions = 0;
        var currentEndpoint: Endpoint = null;
        var startReadingRequests: boolean = false;
        var endpointsRead = 0;
        var endpointDescriptionsRead = 0;
        const thisReference = this;

        let fileStructure: FileStructure;

        return new Promise((resolve, reject) => {

            fs.readFile(filename, (err, data) => {
                data.toString().split('\n').forEach(line => {

                    currentLineNumber++;

                    const splitLine = line.split(' ');

                    if (currentLineNumber === 1) {
                        fileStructure = {
                            videoCount: +splitLine[0],
                            endpointCount: +splitLine[1],
                            requestDescriptionCount: +splitLine[2],
                            cacheCount: +splitLine[3],
                            videoSizes: [],
                            cacheSizes: [],
                            endpoints: [],
                            endpointRequests: []
                        };

                        for (let x = 0; x < fileStructure.cacheCount; x++) {
                            fileStructure.cacheSizes.push(+splitLine[4]);
                        }

                        return;
                    }

                    if (currentLineNumber === 2) {
                        fileStructure.videoSizes = line.split(' ').map((l) => +l);
                        currentlyEndpointDescription = true;

                        return;
                    }

                    if (nextNLinesAreEndpointCacheDescriptions-- > 0) {
                        currentEndpoint.connectedCacheLatencies[+splitLine[0]] = +splitLine[1];

                        if (nextNLinesAreEndpointCacheDescriptions == 0 && endpointsRead == fileStructure.endpointCount) {
                            startReadingRequests = true;
                        } else if (nextNLinesAreEndpointCacheDescriptions == 0) {
                            currentlyEndpointDescription = true;
                        }

                        return;
                    }

                    if (currentlyEndpointDescription) {

                        currentEndpoint = {
                            dataCenterLatency: +splitLine[0],
                            cacheCount: +splitLine[1],
                            connectedCacheLatencies: []
                        };

                        fileStructure.endpoints.push(currentEndpoint);
                        currentlyEndpointDescription = false;
                        nextNLinesAreEndpointCacheDescriptions = currentEndpoint.cacheCount;
                        endpointsRead++;

                        if (endpointsRead == fileStructure.endpointCount) {
                            startReadingRequests = true;
                        }

                        return;
                    }

                    if (startReadingRequests) {


                        if (endpointDescriptionsRead == fileStructure.requestDescriptionCount) {
                            resolve(fileStructure);
                            return;
                        }

                        endpointDescriptionsRead++;

                        fileStructure.endpointRequests.push({
                            count: +splitLine[2],
                            videoNumber: +splitLine[0],
                            endpoint: +splitLine[1]
                        });

                        return;
                    }

                });
            });
        });
    }
}

export const InputService = new _InputService();