import * as hapi from 'hapi';
import { graphqlHapi, graphiqlHapi } from './hapiApollo';
import { expect } from 'chai';
import 'mocha';

import testSuite, { schema as Schema, CreateAppOptions  } from 'graphql-server-integration-testsuite';

function createApp(options: CreateAppOptions) {
  const server = new hapi.Server();

  server.connection({
      host: 'localhost',
      port: 8000,
  });

  server.register({
      register: graphqlHapi,
      options: {
        graphqlOptions: (options && options.graphqlOptions) || { schema: Schema },
        path: '/graphql',
      },
  });

  server.register({
      register: graphiqlHapi,
      options: {
        path: '/graphiql',
        graphiqlOptions: (options && options.graphiqlOptions) || { endpointURL: '/graphql' },
      },
  });

  return server.listener;
}

describe('hapiApollo', () => {
  it('merges optional GraphiQL route config with predefined config', () => {
    const server = new hapi.Server();
    server.connection();

    server.register({
      register: graphiqlHapi,
      options: {
        path: '/graphiql',
        graphiqlOptions: {
          endpointURL: '/graphql',
        },
        route: {
          plugins: {
            foobar: {},
          },
          pre: [{
            assign: 'foobar',
            method: () => 'foobar',
          }],
        },
      },
    });

    const connection = server.table()[0];
    const graphiqlRoute = connection.table[0];
    const { plugins, pre } = graphiqlRoute.settings;

    const preAssigns = (pre as hapi.RoutePrerequisiteObjects[]).map(p => p.assign);

    expect(plugins).to.contain.keys('foobar', 'graphiql');
    expect(preAssigns).to.include.members(['foobar', 'graphiqlParams', 'graphiQLString']);
  });
});

describe('integration:Hapi', () => {
  testSuite(createApp);
});
