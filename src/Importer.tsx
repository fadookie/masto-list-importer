import React, { useState, useRef } from 'react';
import { importLists, assertOk, Config } from './import-lists.lib';

interface Props {
}

export function Importer(props: Props): JSX.Element {
  const csvString = useRef<string | null>(null);
  const [instance, setInstance] = useState<string>("");
  const [accessKey, setAccessKey] = useState<string>("");
  const logLines = useRef<string[]>([]);
  const [log, setLog] = useState<string>("");

  const appendLogLine = (...args: unknown[]) => {
    logLines.current.push(args.join(""));
    setLog(logLines.current.join('\n'));
  }

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
    // console.log("submit");
    // console.log('file content',  csvString.current)
    // console.log("instance", instance);
    // console.log("access key", accessKey);

    logLines.current = [];

    assertOk(csvString.current);

    const config: Config = {
      instance,
      access_token: accessKey,
      logger: appendLogLine,
    }

    importLists(config, csvString.current);
  };
  
  return(
      <div>
        <form onSubmit={handleSubmit}>
          <table>
            <tr>
              <td>
                <label htmlFor="instance">Instance</label>
              </td>
              <td>
                <input id="instance" type="text" value={instance} onChange={e => setInstance(e.target.value)} /><br/>
              </td>
            </tr>
            <tr>
              <td>
                <label htmlFor="access-key">Access Key</label>
              </td>
              <td>
                <input id="access-key" type="text" value={accessKey} onChange={e => setAccessKey(e.target.value)} /><br/>
              </td>
            </tr>
            <tr>
              <td>
                <label htmlFor="csv">lists.csv</label>
              </td>
              <td>
                <input id="csv" type="file" accept=".csv" onChange={e => 
                    handleChangeFile(e.target.files ? e.target.files[0] : null)} /><br/>
              </td>
            </tr>
          </table>
          <input type="submit" value="Submit" />
        </form>
        <hr/>
        <pre>
          {log}
        </pre>
      </div>
  );
}