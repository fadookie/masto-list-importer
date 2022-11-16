import React, { useState, useRef } from 'react';
import { importLists, assertOk, Config } from './import-lists.lib';

interface Props {
}

export function Importer(props: Props): JSX.Element {
  const csvString = useRef<string | null>(null);
  const [instance, setInstance] = useState<string>("");
  const [accessKey, setAccessKey] = useState<string>("");

  const handleFile = (e: ProgressEvent<FileReader>) => {
    const content = e.target?.result;
    assertOk(content);
    csvString.current = (() => {
      if (content instanceof ArrayBuffer) {
        const utf8decoder = new TextDecoder();
        return utf8decoder.decode(content);
      } else {
        return content;
      }
    })();
  }
  
  const handleChangeFile = (file: File | null) => {
    assertOk(file);
    const fileData = new FileReader();
    fileData.onloadend = handleFile;
    fileData.readAsText(file);
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submit");
    console.log('file content',  csvString.current)
    console.log("instance", instance);
    console.log("access key", accessKey);

    assertOk(csvString.current);

    const config: Config = {
      instance,
      access_token: accessKey,
      logger: (...args: unknown[]) => console.log(...args)
    }

    importLists(config, csvString.current);
  };
  
  return(
      <div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="instance">Instance</label>
          <input id="instance" type="text" value={instance} onChange={e => setInstance(e.target.value)} /><br/>
          <label htmlFor="access-key">Access Key</label>
          <input id="access-key" type="text" value={accessKey} onChange={e => setAccessKey(e.target.value)} /><br/>
          <label htmlFor="csv">lists.csv</label>
          <input id="csv" type="file" accept=".csv" onChange={e => 
              handleChangeFile(e.target.files ? e.target.files[0] : null)} /><br/>
          <input type="submit" value="Submit" />
        </form>
      </div>
  );
}