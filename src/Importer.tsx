import React, { useState, useRef } from 'react';
import { importLists, assertOk, Config } from './import-lists.lib';
import { Instructions } from './Instructions';

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

    logLines.current = [];

    const instanceTrim = instance.trim();
    const accessKeyTrim = accessKey.trim();

    if (instanceTrim.length === 0) {
      alert("No instance found, please select one before submitting.");
      return;
    }

    if (accessKeyTrim.length === 0) {
      alert("No access key found, please select one before submitting.");
      return;
    }

    if (!csvString.current) {
      alert("No lists.csv found, please select one before submitting.");
      return;
    }

    const config: Config = {
      instance: instanceTrim,
      access_token: accessKeyTrim,
      logger: appendLogLine,
    }

    importLists(config, csvString.current);
  };
  
  return(
      <div>
        <Instructions />
        <hr/>
        <h2>Config</h2>
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
        <h2>Log:</h2>
        <pre>
          {log}
        </pre>
      </div>
  );
}