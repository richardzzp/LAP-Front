import React, { useEffect, useState } from 'react';
import { Button, Card, Divider, Form, Input, message, Select, Spin, Dropdown, Menu, Icon, Upload } from 'antd';
import apis from '@/services';
import { FormComponentProps } from 'antd/lib/form';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-json5';
import 'ace-builds/src-noconflict/mode-hjson';
import 'ace-builds/src-noconflict/mode-jsoniq';
import 'ace-builds/src-noconflict/snippets/json';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/theme-eclipse';
import { UploadProps } from 'antd/lib/upload';
import { getAccessToken } from '@/utils/authority';

interface Props extends FormComponentProps {
  device: any;
}

interface State {
  propertiesData: any[];
  functionsSelectList: any[];
  functionsInfo: any;
  spinning: boolean;
}

const Functions: React.FC<Props> = props => {
  const {
    form: { getFieldDecorator, setFieldsValue },
    form,
  } = props;

  const initState: State = {
    propertiesData: [],
    functionsSelectList: [],
    functionsInfo: {},
    spinning: false,
  };

  const [functionsSelectList] = useState(initState.functionsSelectList);
  const [functionsInfo, setFunctionsInfo] = useState(initState.functionsInfo);
  const [spinning, setSpinning] = useState(initState.spinning);
  const [editor, setEditor] = useState<any>(null);

  useEffect(() => {
    const { functions } = JSON.parse(props.device.metadata);
    const map = {};
    functions.forEach((item: any) => {
      map[item.id] = item;
      functionsSelectList.push(<Select.Option key={item.id}>{item.name}</Select.Option>);
    });
    setFunctionsInfo(map);
  }, []);

  const debugFunction = () => {
    setSpinning(true);

    form.validateFields((err, fileValue) => {
      if (err) {
        setSpinning(false);
        return;
      }

      localStorage.setItem(
        `function-debug-data-${props.device.id}-${fileValue.functionId}`,
        fileValue.functionData,
      );
      let data;
      try {
        data = JSON.parse(fileValue.functionData);
      } catch (error) {
        message.error('????????????');
        setSpinning(false);
        return;
      }

      apis.deviceInstance
        .invokedFunction(props.device.id, fileValue.functionId, data)
        .then(response => {
          const tempResult = response?.result;
          if (response.status === 200) {
            typeof tempResult === 'object'
              ? setFieldsValue({ logs: JSON.stringify(tempResult) })
              : setFieldsValue({ logs: tempResult });
          }
          setSpinning(false);
        })
        .catch(() => {
          setSpinning(false)
          setFieldsValue({ logs: '????????????' });
        })
        .finally(() => {
          setSpinning(false);
        });
    });
  };

  const uploadProps: UploadProps = {
    accept: '*',
    action: '/jetlinks/file/static',
    headers: {
      'X-Access-Token': getAccessToken(),
    },
    showUploadList: false,
    onChange(info) {
      if (info.file.status === 'done') {
        const content = info.file.response.result
        message.success('??????????????????');
        const cursorPosition = editor.getCursorPosition();
        editor.session.insert(cursorPosition, content);
      }
    },
  };

  const menu = (
    <Menu>
      <Menu.Item>
        <Upload {...uploadProps}>
          <Button icon="upload">??????</Button>
        </Upload>
      </Menu.Item>
    </Menu>
  );

  return (
    <div>
      <Spin spinning={spinning}>
        <Card style={{ marginBottom: 20 }} title="????????????">
          <Form labelCol={{ span: 2 }} wrapperCol={{ span: 22 }}>
            <Form.Item label="????????????">
              {getFieldDecorator('functionId', {
                rules: [{ required: true, message: '?????????????????????' }],
              })(
                <Select
                  placeholder="?????????????????????"
                  onChange={(e: any) => {
                    const map = {};
                    functionsInfo[e].inputs.forEach((item: any) => {
                      map[item.id] = item.name;
                    });
                    setFieldsValue({
                      functionData:
                        localStorage.getItem(`function-debug-data-${props.device.id}-${e}`) ||
                        JSON.stringify(map, null, 2),
                    });
                  }}
                >
                  {functionsSelectList}
                </Select>,
              )}
            </Form.Item>
            <Form.Item>
              <div style={{marginLeft: '9%'}}>
                <Dropdown overlay={menu}>
                  <Button>??????<Icon type="down" /></Button>
                </Dropdown>
              </div>
            </Form.Item>
            <Form.Item label="?????????">
              {getFieldDecorator('functionData', {
                rules: [{ required: true, message: '?????????????????????' }],
              })(
                <AceEditor
                  ref={l => setEditor(l && l.editor)}
                  mode="json"
                  theme="eclipse"
                  name="app_code_editor"
                  key="simulator"
                  fontSize={14}
                  showPrintMargin
                  showGutter
                  wrapEnabled
                  highlightActiveLine //???????????????
                  enableSnippets //???????????????
                  style={{ width: '100%', height: 300 }}
                  setOptions={{
                    enableBasicAutocompletion: true, //??????????????????????????????
                    enableLiveAutocompletion: true, //?????????????????????????????? ?????????????????????????????????
                    enableSnippets: true, //???????????????
                    showLineNumbers: true,
                    tabSize: 2,
                  }}
                />,
              )}
            </Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={() => {
                  debugFunction();
                }}
              >
                ??????
              </Button>
              <Divider type="vertical" />
              <Button type="ghost" onClick={() => setFieldsValue({ logs: undefined })}>
                ??????
              </Button>
            </div>

            <Form.Item label="???????????????" style={{ paddingTop: 20 }}>
              {getFieldDecorator('logs', {})(<Input.TextArea rows={4} readOnly />)}
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </div>
  );
};

export default Form.create<Props>()(Functions);
