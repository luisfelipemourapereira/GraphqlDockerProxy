import { K8sWatcher } from '../K8sWatcher'
import { Readable } from 'stream'
import '../../../idx'

describe('tests the K8sWatcher', () => {

  let k8sWatcher = null
  let endpoints = {}
  beforeEach(() => {
    k8sWatcher = new K8sWatcher()
    endpoints = {
      swapi:
      [
        { url: 'http://swapi.starwars:9002/graphql',
          namespace: 'swapi',
          typePrefix: 'swapi_',
          __created: '2018-08-21T05:39:17Z',
          __imageID: '',
          __deploymentName: 'swapi',
        },

      ],
    }
  })

  describe('tests the updatelistener is Called by deployment stream', () => {
    let mockedStream = null
    beforeEach(() => {
      mockedStream = new Readable()
      k8sWatcher.client = {
        apis: {
          apps: {
            v1beta2: {
              watch: {
                namespaces: () => {
                  return {
                    deployments: {
                      getStream: () => {
                        mockedStream._read = function() { /* do nothing */ }
                        return mockedStream
                      },
                    },
                  }
                },
              },
            },
          },
        },
      }
      k8sWatcher.endpoints = endpoints
    })

    it('by ADDING deyployment', () => {
      const callMockFunc = jest.fn()
      k8sWatcher.setDataUpdatedListener(callMockFunc)
      k8sWatcher.deploymentsNames = {
        swapi: true,
      }
      k8sWatcher.__watchDeploymentsForNamespace('mock')
      const mockStreamObj = {
        type: 'ADDED',
        object: {
          metadata: {
            creationTimestamp: 'mock',
            resourceVersion: 'mock',
          },
          spec: {
            template: {
              metadata: {
                labels: {
                  app: 'swapi',

                },
              },
            },
          },
        },
      }
      mockedStream.emit('data', JSON.stringify(mockStreamObj))

      expect(callMockFunc).toBeCalledWith({
        swapi:
        [
          { url: 'http://swapi.starwars:9002/graphql',
            namespace: 'swapi',
            typePrefix: 'swapi_',
            __created: 'mock mock',
            __imageID: '',
            __deploymentName: 'swapi',
          },
        ],
      })
    })

    it('by MODIFIED deyployment', () => {
      const callMockFunc = jest.fn()
      k8sWatcher.setDataUpdatedListener(callMockFunc)
      k8sWatcher.deploymentsNames = {
        swapi: true,
      }
      k8sWatcher.__watchDeploymentsForNamespace('mock')
      const mockStreamObj = {
        type: 'MODIFIED',
        object: {
          metadata: {
            creationTimestamp: 'mock',
            resourceVersion: 'mock',
          },
          spec: {
            template: {
              metadata: {
                labels: {
                  app: 'swapi',

                },
              },
            },
          },
        },
      }
      mockedStream.emit('data', JSON.stringify(mockStreamObj))

      expect(callMockFunc).toBeCalledWith({
        swapi:
        [
          { url: 'http://swapi.starwars:9002/graphql',
            namespace: 'swapi',
            typePrefix: 'swapi_',
            __created: 'mock mock',
            __imageID: '',
            __deploymentName: 'swapi',
          },
        ],
      })
    })

    it('by DELETED deyployment', () => {
      const callMockFunc = jest.fn()
      k8sWatcher.setDataUpdatedListener(callMockFunc)
      k8sWatcher.deploymentsNames = {
        swapi: true,
      }
      k8sWatcher.__watchDeploymentsForNamespace('mock')
      const mockStreamObj = {
        type: 'DELETED',
        object: {
          metadata: {
            creationTimestamp: 'mock',
            resourceVersion: 'mock',
          },
          spec: {
            template: {
              metadata: {
                labels: {
                  app: 'swapi',

                },
              },
            },
          },
        },
      }
      mockedStream.emit('data', JSON.stringify(mockStreamObj))

      expect(callMockFunc).toBeCalledWith({})
    })

  })


  describe('tests updateUrl ', () => {
    it('by absolut url', () => {
      const url = 'https://test.de/graphql'
      expect(k8sWatcher.updateUrl(url, {})).toBe(url)
    })
    it('by relativ url', () => {
      const sockData = {
        metadata: {
          name: 'test',
          namespace: 'testNamespace',
        },
      }
      expect(k8sWatcher.updateUrl(':3000/graphql', sockData)).toBe('http://test.testNamespace:3000/graphql')
    })
  })

  describe('tests __deleteEndpoint', () => {
    it (' delete all', () => {
      k8sWatcher.endpoints = endpoints
      k8sWatcher.__deleteEndpoint('swapi', 'swapi')
      expect(k8sWatcher.endpoints).toEqual({})

    })

    it ('delete only one ', () => {
      const noDelete = {
        url: 'http://nodelete.default:9002/graphql',
        namespace: 'swapi',
        typePrefix: 'swapi_',
        __created: '2018-08-21T05:39:17Z',
        __imageID: '',
        __deploymentName: 'nodelete',
      }
      endpoints.swapi.push(noDelete)
      k8sWatcher.endpoints = endpoints

      k8sWatcher.__deleteEndpoint('swapi', 'swapi')
      expect(k8sWatcher.endpoints).toEqual({
        swapi: [noDelete],
      })
    })
  })

})
