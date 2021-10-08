import '../styles/globals.css'
import CeramicClient from '@ceramicnetwork/http-client';
import { useEffect, useState } from 'react';
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver';
import { ThreeIdConnect,  EthereumAuthProvider } from '@3id/connect'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { DID } from 'dids'
import DataModels from './components/DataModels';

const API_URL = 'https://ceramic-clay.3boxlabs.com';

function MyApp() {
  const [testDoc, setTestDoc] = useState();
  const [loadedDoc, setLoadedDoc] = useState();
  const [updatedDoc, setUpdatedDoc] = useState();
  const [streamId, setStreamId] = useState();
  const [ceramic, setCeramic] = useState();

  useEffect(() => {

    (async () => {
      const newCeramic = new CeramicClient(API_URL);

      const resolver = {
        ...ThreeIdResolver.getResolver(newCeramic),
      }
      const did = new DID({ resolver })
      newCeramic.did = did;
      const addresses = await window.ethereum.enable()
      const threeIdConnect = new ThreeIdConnect()
      const authProvider = new EthereumAuthProvider(window.ethereum, addresses[0])
      await threeIdConnect.connect(authProvider)

      const provider = await threeIdConnect.getDidProvider();
      newCeramic.did.setProvider(provider);
      await newCeramic.did.authenticate();

      setCeramic(newCeramic);

      const doc = await TileDocument.create(newCeramic, {hello: 'benwar'})
      setTestDoc(JSON.stringify(doc.content));

      const streamId = doc.id.toString();
      setStreamId(streamId);

      const newLoadedDoc = await TileDocument.load(newCeramic, streamId)
      setLoadedDoc(JSON.stringify(newLoadedDoc.content));

      await doc.update({foo: 'baz'}, {tags: ['baz']});
      const newUpdatedDoc = await TileDocument.load(newCeramic, streamId)
      setUpdatedDoc(JSON.stringify(newUpdatedDoc.content));

      for(let commitID of newUpdatedDoc.allCommitIds) {
        const commitDoc = await TileDocument.load(newCeramic, commitID);
        console.log(JSON.stringify(commitDoc.content));
      }

    })();
  }, [setCeramic, setTestDoc, setStreamId]);

  function getTestDocUI(testDoc, streamId) {
    let content = <h3>Test doc loading...</h3>
    if(testDoc && streamId) {
      content = <div>
        <h3>Test doc: {testDoc}</h3>
        <div> {streamId} </div>
        <h3>Test doc from load: {loadedDoc}</h3>
        <h3>Test doc after update: {updatedDoc}</h3>
      </div>;
    }
    return content
  }

  return (
    <div className="App">
      <h1>Ceramic is here</h1>
      {getTestDocUI(testDoc, streamId)}
      <div>
        <DataModels ceramic={ceramic} />
      </div>
   </div>
  );
}

export default MyApp;
