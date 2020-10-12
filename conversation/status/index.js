function run({ getData, log, logError }) {
  console.log("testing");
  log("simple text log");
  logError("testing working error from script file");

  const data = getData();
  const parentData = getData(1);

  // log(`data: ${data}`);
  // log(`parent data: ${parentData}`);

  const content = `
    <div>
      <psk-img view-model="@image" />
      <psk-label view-model="@data" />
      <psk-label view-model="@parentData" />
      <psk-label view-model="@date" />
    </div>
  `;
  const model = {
    image: {
      src: `https://source.unsplash.com/600x400/?sig=${new Date().getTime()}&coin`,
    },
    date: {
      label: `Running query at ${new Date().toUTCString()}...`,
    },
    data: {
      label: `Period: ${data}`,
    },
    parentData: {
      label: `Coin: ${parentData}`,
    },
  };

  log(content, model);
}

// export default function run({ option, parent, log }) {
//   /*
//     option will contain the option that generated this runScript.
//     parent will contain the parent option and also the parent of the option (if applicable)
//     obs: option and parent are splited in order to not make "parent" a reserved word for the option configuration

//     e.g.
//     option = {
//       title: "Month",
//       runScript: "conversation/status"
//     };

//     parent = {
//       options: {
//         title: "Eth",
//         text: "Choose option",
//       }
//       parent: {
//         option: {
//           title: Status,
//           text: "Chose Coin"
//         }
//       }
//     }

//     Or, we don't care if the option has an attributed called "parent", and we can merge "option" and "parent"
//     e.g.
//     options = {
//       title: "Month",
//       runScript: "conversation/status",
//       parent: {
//         title: "Eth",
//         text: "Choose option",
//         parent: {
//           title: Status,
//           text: "Chose Coin"
//         }
//       }
//     }

//     return content for status conversation response in order to show it in the conversation history

//     Something like JSX in React?
//     Something like { component: 'psk-status-info', options: { coin: "Eth", period: "Month" }}

//     <psk-status-info coin="ETH"></psk-status-info>

//     log('<psk-status-info data-model="@data"></psk-status-info>', { data });
//      addContent('<psk-label label="@data" />', { data: 'label text' })
//   */

//   get("parent.option", "defaultValue");
// }
