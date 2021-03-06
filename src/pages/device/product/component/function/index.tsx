import React, { useContext, useEffect, useState } from 'react';
import Form, { FormComponentProps } from 'antd/lib/form';
import {
  Input,
  Radio,
  Button,
  List,
  Select,
  Drawer,
  Col,
  Row,
  Icon,
  AutoComplete,
  InputNumber,
  Collapse,
  Spin,
  Dropdown,
  Menu
} from 'antd';
import styles from '../index.less';
import { Parameter, FunctionMeta } from '../data.d';
import { renderUnit } from '@/pages/device/public';
import Paramter from '../paramter';
import { ProductContext } from "@/pages/device/product/context";
import apis from "@/services";

interface Props extends FormComponentProps {
  save: Function;
  data: Partial<FunctionMeta>;
  close: Function;
  unitsData: any;
}

interface State {
  editVisible: boolean;
  currentItem: Partial<Parameter>;
  currentTarget: string;
  data: Partial<FunctionMeta>;
  dataType: string;
  outputVisible: boolean;
  inputVisible: boolean;
  enumData: any[];
  outputParameter: Parameter[];
  inputs: Parameter[];
  currentParameter: any;
  arrayEnumData: any[];
  arrParameterVisible: boolean;
  arrayProperties: any[];
  aType: string;
}

const FunctionDefin: React.FC<Props> = props => {
  const initState: State = {
    data: props.data,
    editVisible: false,
    currentItem: {},
    currentTarget: '',
    dataType: props.data.output?.type || '',
    outputVisible: false,
    inputVisible: false,
    enumData: props.data.output?.elements || [{ text: '', value: '', id: 0 }],
    outputParameter: props.data.output?.properties || [],
    inputs: [],
    currentParameter: {},
    arrayProperties: props.data?.output?.elementType?.properties || [],
    arrayEnumData: props.data.output?.elementType?.elements || [{ text: '', value: '', id: 0 }],
    aType: props.data.output?.elementType?.type || '',
    arrParameterVisible: false,
  };

  const {
    form: { getFieldDecorator, getFieldsValue },
  } = props;
  const [inputs, setInputs] = useState(initState.data.inputs || []);
  const [outputParameter, setOutputParameter] = useState(initState.outputParameter);
  const [dataType, setDataType] = useState(initState.dataType);
  const [enumData, setEnumData] = useState(initState.enumData);
  const [outputVisible, setOutputVisible] = useState(initState.outputVisible);
  const [inputVisible, setInputVisible] = useState(initState.inputVisible);
  const [currentParameter, setCurrentParameter] = useState(initState.currentParameter);
  const [configMetadata, setConfigMetadata] = useState<any[]>([]);
  const [loadConfig, setLoadConfig] = useState<boolean>(false);
  const [aType, setAType] = useState<string>(initState.aType);
  const [arrayProperties, setArrayProperties] = useState(initState.arrayProperties);
  const [arrParameterVisible, setArrParameterVisible] = useState(initState.arrParameterVisible);
  const [arrayEnumData, setArrayEnumData] = useState(initState.arrayEnumData);
  const saveData = (onlySave: boolean) => {
    const { form } = props;
    // const { id } = props.data;
    form.validateFields((err: any, fieldValue: any) => {
      if (err) return;
      const {
        output: { type },
      } = fieldValue;
      const data = fieldValue;
      if (type === 'object') {
        data.output.properties = outputParameter;
      } else if (type === 'enum') {
        data.output.elements = enumData;
      }
      if (dataType === 'array' && data.output.elementType.type === 'object') {
        data.output.elementType.properties = arrayProperties;
      }
      props.save({ ...data, inputs }, onlySave);
    });
  };

  const menu = (
    <Menu>
      <Menu.Item key="1">
        <Button type="default" onClick={() => {
          saveData(true);
        }}>
          ?????????
        </Button>
      </Menu.Item>
      <Menu.Item key="2">
        <Button onClick={() => {
          saveData(false);
        }}>???????????????</Button>
      </Menu.Item>
    </Menu>
  );

  let dataSource = [{
    text: 'String?????????UTC????????? (??????)',
    value: 'string',
  }, 'yyyy-MM-dd', 'yyyy-MM-dd HH:mm:ss', 'yyyy-MM-dd HH:mm:ss EE', 'yyyy-MM-dd HH:mm:ss zzz'];

  const renderAType = () => {
    switch (aType) {
      case 'float':
      case 'double':
        return (
          <div>
            <Form.Item label="??????">
              {getFieldDecorator('valueType.elementType.scale', {
                // initialValue: initState.data.valueType?.scale,
              })(<InputNumber precision={0} min={0} step={1} placeholder="???????????????" style={{ width: '100%' }} />)}
            </Form.Item>

            <Form.Item label="??????">
              {getFieldDecorator('valueType.elementType.unit', {
                // initialValue: initState.data.valueType?.unit,
              })(renderUnit(props.unitsData))}
            </Form.Item>
          </div>
        );
      case 'int':
      case 'long':
        return (
          <div>
            <Form.Item label="??????">
              {getFieldDecorator('valueType.elementType.unit', {
                initialValue: initState.data.valueType?.elementType?.unit,
              })(renderUnit(props.unitsData))}
            </Form.Item>
          </div>
        );
      case 'string':
        return (
          <div>
            <Form.Item label="????????????">
              {getFieldDecorator('valueType.elementType.expands.maxLength', {
                initialValue: initState.data.valueType?.elementType.expands?.maxLength,
              })(<Input />)}
            </Form.Item>
          </div>
        );
      case 'boolean':
        return (
          <div>
            <Form.Item label="?????????" style={{ height: 69 }}>
              <Col span={11}>
                {getFieldDecorator('valueType.elementType.trueText', {
                  initialValue: initState.data.valueType?.elementType.trueText || '???',
                })(<Input placeholder="trueText" />)}
              </Col>
              <Col span={2} push={1}>
                ~
              </Col>
              <Col span={11}>
                <Form.Item>
                  {getFieldDecorator('valueType.elementType.trueValue', {
                    initialValue: initState.data.valueType?.elementType.trueValue || true,
                  })(<Input placeholder="trueValue" />)}
                </Form.Item>
              </Col>
            </Form.Item>
            <Form.Item style={{ height: 69 }}>
              <Col span={11}>
                {getFieldDecorator('valueType.elementType.falseText', {
                  initialValue: initState.data.valueType?.elementType.falseText || '???',
                })(<Input placeholder="falseText" />)}
              </Col>
              <Col span={2} push={1}>
                ~
              </Col>
              <Col span={11}>
                <Form.Item>
                  {getFieldDecorator('valueType.elementType.falseValue', {
                    initialValue: initState.data.valueType?.elementType.falseValue || false,
                  })(<Input placeholder="falseValue" />)}
                </Form.Item>
              </Col>
            </Form.Item>
          </div>
        );
      case 'date':
        return (
          <div>
            <Form.Item label="????????????">
              {getFieldDecorator('valueType.elementType.format', {
                initialValue: initState.data.valueType?.elementType.format,
              })(
                <AutoComplete dataSource={dataSource} placeholder="???????????????String?????????UTC????????? (??????)"
                  filterOption={(inputValue, option) =>
                    option?.props?.children?.toUpperCase()?.indexOf(inputValue.toUpperCase()) !== -1
                  }
                />,
              )}
            </Form.Item>
          </div>
        );
      case 'enum':
        return (
          <div>
            <Form.Item label="?????????">
              {arrayEnumData.map((item, index) => (
                <Row key={item.id}>
                  <Col span={10}>
                    <Input
                      placeholder="??????"
                      value={item.value}
                      onChange={event => {
                        arrayEnumData[index].value = event.target.value;
                        setArrayEnumData([...arrayEnumData]);
                      }}
                    />
                  </Col>
                  <Col span={1} style={{ textAlign: 'center' }}>
                    <Icon type="arrow-right" />
                  </Col>
                  <Col span={10}>
                    <Input
                      placeholder="????????????????????????"
                      value={item.text}
                      onChange={event => {
                        arrayEnumData[index].text = event.target.value;
                        setArrayEnumData([...arrayEnumData]);
                      }}
                    />
                  </Col>
                  <Col span={3} style={{ textAlign: 'center' }}>
                    {index === 0 ? (
                      (arrayEnumData.length - 1) === 0 ? (
                        <Icon type="plus-circle"
                          onClick={() => {
                            setArrayEnumData([...arrayEnumData, { id: arrayEnumData.length + 1 }]);
                          }}
                        />
                      ) : (
                          <Icon type="minus-circle"
                            onClick={() => {
                              arrayEnumData.splice(index, 1);
                              setArrayEnumData([...arrayEnumData]);
                            }}
                          />
                        )
                    ) : (
                        index === (arrayEnumData.length - 1) ? (
                          <Row>
                            <Icon type="plus-circle"
                              onClick={() => {
                                setArrayEnumData([...arrayEnumData, { id: arrayEnumData.length + 1 }]);
                              }}
                            />
                            <Icon style={{ paddingLeft: 10 }}
                              type="minus-circle"
                              onClick={() => {
                                arrayEnumData.splice(index, 1);
                                setArrayEnumData([...arrayEnumData]);
                              }}
                            />
                          </Row>
                        ) : (
                            <Icon type="minus-circle"
                              onClick={() => {
                                arrayEnumData.splice(index, 1);
                                setArrayEnumData([...arrayEnumData]);
                              }}
                            />
                          )
                      )}
                  </Col>
                </Row>
              ))}
            </Form.Item>
          </div>
        );
      case 'object':
        return (
          <Form.Item label="JSON??????">
            {arrayProperties.length > 0 && (
              <List
                bordered
                dataSource={arrayProperties}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        onClick={() => {
                          setArrParameterVisible(true);
                          setCurrentParameter(item);
                        }}
                      >
                        ??????
                      </Button>,
                      <Button
                        type="link"
                        onClick={() => {
                          const index = arrayProperties.findIndex((i: any) => i.id === item.id);
                          arrayProperties.splice(index, 1);
                          setArrayProperties([...arrayProperties]);
                        }}
                      >
                        ??????
                      </Button>,
                    ]}
                  >
                    ???????????????{item.name}
                  </List.Item>
                )}
              />
            )}
            <Button
              type="link"
              onClick={() => {
                setCurrentParameter({});
                setArrParameterVisible(true);
              }}
            >
              <Icon type="plus" />
              ????????????
            </Button>
          </Form.Item>
        );
      case 'file':
        return (
          <Form.Item label="????????????">
            {getFieldDecorator('valueType.elementType.fileType', {
              initialValue: initState.data.valueType?.elementType.fileType,
            })(
              <Select>
                <Select.Option value="url">URL(??????)</Select.Option>
                <Select.Option value="base64">Base64(Base64??????)</Select.Option>
                <Select.Option value="binary">Binary(?????????)</Select.Option>
              </Select>,
            )}
          </Form.Item>
        );
      case 'password':
        return (
          <div>
            <Form.Item label="????????????">
              {getFieldDecorator('valueType.elementType.expands.maxLength', {
                initialValue: initState.data.valueType?.elementType?.expands?.maxLength,
              })(<Input addonAfter="??????" />)}
            </Form.Item>
          </div>
        );
      default:
        return null;
    }
  }


  const renderDataType = () => {
    switch (dataType) {
      case 'float':
      case 'double':
        return (
          <div>
            <Form.Item label="??????">
              {getFieldDecorator('output.scale', {
                initialValue: initState.data.output?.scale,
              })(<InputNumber min={0} step={1} placeholder="???????????????" style={{ width: '100%' }} />)}
            </Form.Item>

            <Form.Item label="??????">
              {getFieldDecorator('output.unit', {
                initialValue: initState.data.output?.unit,
              })(renderUnit(props.unitsData))}
            </Form.Item>
          </div>
        );
      case 'int':
      case 'long':
        return (
          <div>
            <Form.Item label="??????">
              {getFieldDecorator('output.unit', {
                initialValue: props.data.output?.unit,
              })(renderUnit(props.unitsData))}
            </Form.Item>
          </div>
        );
      case 'string':
        return (
          <div>
            <Form.Item label="????????????">
              {getFieldDecorator('output.expands.maxLength', {
                initialValue: props.data.output?.expands?.maxLength,
              })(<Input />)}
            </Form.Item>
          </div>
        );
      case 'boolean':
        return (
          <div>
            <Form.Item label="?????????" style={{ height: 69 }}>
              <Col span={11}>
                {getFieldDecorator('output.trueText', {
                  initialValue: initState.data.output?.trueText || '???',
                })(<Input placeholder="trueText" />)}
              </Col>
              <Col span={2} push={1}>
                ~
              </Col>
              <Col span={11}>
                <Form.Item>
                  {getFieldDecorator('output.trueValue', {
                    initialValue: initState.data.output?.trueValue || true,
                  })(<Input placeholder="trueValue" />)}
                </Form.Item>
              </Col>
            </Form.Item>
            <Form.Item style={{ height: 69 }}>
              <Col span={11}>
                {getFieldDecorator('output.falseText', {
                  initialValue: initState.data.output?.falseText || '???',
                })(<Input placeholder="falseText" />)}
              </Col>
              <Col span={2} push={1}>
                ~
              </Col>
              <Col span={11}>
                <Form.Item>
                  {getFieldDecorator('output.falseValue', {
                    initialValue: initState.data.output?.falseValue || false,
                  })(<Input placeholder="falseValue" />)}
                </Form.Item>
              </Col>
            </Form.Item>
          </div>
        );
      case 'date':
        return (
          <div>
            <Form.Item label="????????????">
              {getFieldDecorator('output.format', {
                initialValue: props.data.output?.format,
              })(
                <AutoComplete dataSource={dataSource} placeholder="???????????????String?????????UTC????????? (??????)"
                  filterOption={(inputValue, option) =>
                    option?.props?.children?.toUpperCase()?.indexOf(inputValue.toUpperCase()) !== -1
                  }
                />,
              )}
            </Form.Item>
          </div>
        );
      case 'array':
        return (
          <div>
            <Form.Item label="????????????">
              {getFieldDecorator('output.elementType.type', {
                initialValue: props.data.output?.elementType?.type,
              })(
                <Select
                  placeholder="?????????"
                  onChange={(value: string) => {
                    setAType(value);
                    getMetadata(undefined, value)
                  }}
                >
                  <Select.OptGroup label="????????????">
                    <Select.Option value="int">int(?????????)</Select.Option>
                    <Select.Option value="long">long(????????????)</Select.Option>
                    <Select.Option value="float">float(??????????????????)</Select.Option>
                    <Select.Option value="double">double(??????????????????)</Select.Option>
                    <Select.Option value="string">text(?????????)</Select.Option>
                    <Select.Option value="boolean">bool(?????????)</Select.Option>
                  </Select.OptGroup>
                  <Select.OptGroup label="????????????">
                    <Select.Option value="date">date(?????????)</Select.Option>
                    <Select.Option value="enum">enum(??????)</Select.Option>
                    <Select.Option value="array">array(??????)</Select.Option>
                    <Select.Option value="object">object(?????????)</Select.Option>
                    <Select.Option value="file">file(??????)</Select.Option>
                    <Select.Option value="password">password(??????)</Select.Option>
                    <Select.Option value="geoPoint">geoPoint(????????????)</Select.Option>
                  </Select.OptGroup>
                </Select>,
              )}
            </Form.Item>
            {renderAType()}
          </div>
        );
      case 'enum':
        return (
          <div>
            <Form.Item label="?????????">
              {enumData.map((item, index) => (
                <Row key={item.id}>
                  <Col span={10}>
                    <Input
                      placeholder="??????"
                      value={item.value}
                      onChange={event => {
                        enumData[index].value = event.target.value;
                        setEnumData([...enumData]);
                      }}
                    />
                  </Col>
                  <Col span={1} style={{ textAlign: 'center' }}>
                    <Icon type="arrow-right" />
                  </Col>
                  <Col span={10}>
                    <Input
                      placeholder="????????????????????????"
                      value={item.text}
                      onChange={event => {
                        enumData[index].text = event.target.value;
                        setEnumData([...enumData]);
                      }}
                    />
                  </Col>
                  <Col span={3} style={{ textAlign: 'center' }}>
                    {index === 0 ? (
                      (enumData.length - 1) === 0 ? (
                        <Icon type="plus-circle"
                          onClick={() => {
                            setEnumData([...enumData, { id: enumData.length + 1 }]);
                          }}
                        />
                      ) : (
                          <Icon type="minus-circle"
                            onClick={() => {
                              enumData.splice(index, 1);
                              setEnumData([...enumData]);
                            }}
                          />
                        )
                    ) : (
                        index === (enumData.length - 1) ? (
                          <Row>
                            <Icon type="plus-circle"
                              onClick={() => {
                                setEnumData([...enumData, { id: enumData.length + 1 }]);
                              }}
                            />
                            <Icon style={{ paddingLeft: 10 }}
                              type="minus-circle"
                              onClick={() => {
                                enumData.splice(index, 1);
                                setEnumData([...enumData]);
                              }}
                            />
                          </Row>
                        ) : (
                            <Icon type="minus-circle"
                              onClick={() => {
                                enumData.splice(index, 1);
                                setEnumData([...enumData]);
                              }}
                            />
                          )
                      )}
                  </Col>
                </Row>
              ))}
            </Form.Item>
          </div>
        );
      case 'object':
        return (
          <Form.Item label="JSON??????">
            {outputParameter.length > 0 && (
              <List
                bordered
                dataSource={outputParameter}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        onClick={() => {
                          setOutputVisible(true);
                          setCurrentParameter(item);
                        }}
                      >
                        ??????
                      </Button>,
                      <Button
                        type="link"
                        onClick={() => {
                          const index = outputParameter.findIndex((i: any) => i.id === item.id);
                          outputParameter.splice(index, 1);
                          setOutputParameter([...outputParameter]);
                        }}
                      >
                        ??????
                      </Button>,
                    ]}
                  >
                    ???????????????{item.name}
                  </List.Item>
                )}
              />
            )}
            <Button
              type="link"
              onClick={() => {
                setOutputVisible(true);
                setCurrentParameter({});
              }}
            >
              <Icon type="plus" />
              ????????????
            </Button>
          </Form.Item>
        );
      case 'file':
        return (
          <Form.Item label="????????????">
            {getFieldDecorator('output.fileType', {
              initialValue: '',
            })(
              <Select>
                <Select.Option value="url">URL(??????)</Select.Option>
                <Select.Option value="base64">Base64(Base64??????)</Select.Option>
                <Select.Option value="binary">Binary(?????????)</Select.Option>
              </Select>,
            )}
          </Form.Item>
        );
      case 'password':
        return (
          <div>
            <Form.Item label="????????????">
              {getFieldDecorator('valueType.expands.maxLength', {
                initialValue: initState.data.output?.expands?.maxLength,
              })(<Input addonAfter="??????" />)}
            </Form.Item>
          </div>
        );
      default:
        return null;
    }
  };

  const product = useContext<any>(ProductContext);

  useEffect(() => getMetadata(), []);
  const getMetadata = (id?: any, type?: any) => {
    const data = getFieldsValue(['id', 'output.type']);
    if (id) {
      data.id = id;
    }
    if (type) {
      data.output.type = type;
    }

    if (data.id && data.output.type) {
      setLoadConfig(true);
      apis.deviceProdcut.configMetadata({
        productId: product.id,
        modelType: 'function',
        modelId: data.id,
        typeId: data.output.type
      }).then(rsp => {
        setLoadConfig(false);
        setConfigMetadata(rsp.result);
      }).finally(() => setLoadConfig(false));
    }
  }
  const renderItem = (config: any) => {
    switch (config.type.type) {
      case 'int':
      case 'string':
        return <Input />
      case 'enum':
        return (
          <Select>
            {config.type.elements.map(i => (
              <Select.Option key={i.value} value={i.value}>{i.text}</Select.Option>
            ))}
          </Select>
        );
      default:
        return <Input />
    }
  }

  const renderConfigMetadata = () => {
    return (
      <Collapse>{
        (configMetadata || []).map((item, index) => {
          return (
            <Collapse.Panel header={item.name} key={index}>
              {item.properties.map((config: any) => (
                <Form.Item label={config.name} key={config.property}>
                  {getFieldDecorator(`expands.${config.property}`, {
                    initialValue: (initState.data?.expands || {})[config.property]
                  })(renderItem(config))}
                </Form.Item>
              ))}
            </Collapse.Panel>
          )
        })}</Collapse>
    )
  }
  return (
    <Drawer
      title={!initState.data.id ? `??????????????????` : `??????????????????`}
      placement="right"
      closable={false}
      onClose={() => props.close()}
      visible
      width="30%"
    >
      <Spin spinning={loadConfig}>

        <Form className={styles.paramterForm}>
          <Form.Item label="????????????">
            {getFieldDecorator('id', {
              rules: [
                { required: true, message: '?????????????????????' },
                { max: 64, message: '?????????????????????64?????????' },
                { pattern: new RegExp(/^[0-9a-zA-Z_\-]+$/, "g"), message: '??????????????????????????????????????????????????????????????????' }
              ],
              initialValue: initState.data.id,
            })(
              <Input
                onBlur={(value) => getMetadata(value.target.value, undefined)}
                disabled={!!initState.data.id}
                style={{ width: '100%' }}
                placeholder="?????????????????????"
              />,
            )}
          </Form.Item>
          <Form.Item label="????????????">
            {getFieldDecorator('name', {
              rules: [
                { required: true, message: '?????????????????????' },
                { max: 200, message: '?????????????????????200?????????' }
              ],
              initialValue: initState.data.name,
            })(<Input />)}
          </Form.Item>
          <Form.Item label="????????????">
            {getFieldDecorator('async', {
              rules: [{ required: true }],
              initialValue: initState.data.async,
            })(
              <Radio.Group>
                <Radio value>???</Radio>
                <Radio value={false}>???</Radio>
              </Radio.Group>,
            )}
          </Form.Item>
          <Form.Item label="????????????">
            {inputs.length > 0 && (
              <List
                bordered
                dataSource={inputs}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        onClick={() => {
                          setInputVisible(true);
                          setCurrentParameter(item);
                        }}
                      >
                        ??????
                    </Button>,
                      <Button
                        type="link"
                        onClick={() => {
                          const index = inputs.findIndex((i: any) => i.id === item.id);
                          inputs.splice(index, 1);
                          setInputs([...inputs]);
                        }}
                      >
                        ??????
                    </Button>,
                    ]}
                  >
                    ???????????????{item.name}
                  </List.Item>
                )}
              />
            )}
            <Button type="link" icon="plus" onClick={() => {
              setCurrentParameter({});
              setInputVisible(true);
            }}>
              ????????????
          </Button>
          </Form.Item>
          <Form.Item label="????????????">
            {getFieldDecorator('output.type', {
              initialValue: initState.data.output?.type,
            })(
              <Select
                placeholder="?????????"
                onChange={(value: string) => {
                  setDataType(value);
                  getMetadata(undefined, value)
                }}
              >
                <Select.OptGroup label="????????????">
                  <Select.Option value="int">int(?????????)</Select.Option>
                  <Select.Option value="long">long(????????????)</Select.Option>
                  <Select.Option value="double">double(??????????????????)</Select.Option>
                  <Select.Option value="float">float(??????????????????)</Select.Option>
                  <Select.Option value="string">text(?????????)</Select.Option>
                  <Select.Option value="boolean">bool(?????????)</Select.Option>
                  <Select.Option value="date">date(?????????)</Select.Option>
                </Select.OptGroup>
                <Select.OptGroup label="????????????">
                  <Select.Option value="enum">enum(??????)</Select.Option>
                  <Select.Option value="array">array(??????)</Select.Option>
                  <Select.Option value="object">object(?????????)</Select.Option>
                  <Select.Option value="file">file(??????)</Select.Option>
                  <Select.Option value="password">password(??????)</Select.Option>
                  <Select.Option value="geoPoint">geoPoint(????????????)</Select.Option>
                </Select.OptGroup>
              </Select>,
            )}
          </Form.Item>
          {renderDataType()}
          {!loadConfig && renderConfigMetadata()}
          <Form.Item label="??????">
            {getFieldDecorator('description', {
              initialValue: initState.data.description,
            })(<Input.TextArea rows={3} />)}
          </Form.Item>
        </Form>

      </Spin>
      <div
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '100%',
          borderTop: '1px solid #e9e9e9',
          padding: '10px 16px',
          background: '#fff',
          textAlign: 'right',
        }}
      >
        <Button
          onClick={() => {
            props.close();
          }}
          style={{ marginRight: 8 }}
        >
          ??????
        </Button>
        <Dropdown overlay={menu}>
          <Button icon="menu" type="primary">
            ??????<Icon type="down" />
          </Button>
        </Dropdown>
        {/* <Button
          onClick={() => {
            saveData();
          }}
          type="primary"
        >
          ??????
        </Button> */}
      </div>
      {outputVisible && (
        <Paramter
          data={currentParameter}
          unitsData={props.unitsData}
          save={item => {
            const temp = outputParameter.filter(i => i.id !== item.id);
            setOutputParameter([...temp, item]);
          }}
          close={() => setOutputVisible(false)}
        />
      )}
      {inputVisible && (
        <Paramter
          unitsData={props.unitsData}
          data={currentParameter}
          save={item => {
            const temp = inputs.filter(i => i.id !== item.id);
            setInputs([...temp, item]);
          }}
          close={() => {
            setCurrentParameter({});
            setInputVisible(false);
          }}
        />
      )}
      {arrParameterVisible && (
        <Paramter
          save={item => {
            const index = arrayProperties.findIndex((e: any) => e.id === item.id);
            if (index === -1) {
              arrayProperties.push(item);
            } else {
              arrayProperties[index] = item;
            }
            setArrayProperties(arrayProperties);
          }}
          unitsData={props.unitsData}
          close={() => {
            setCurrentParameter({});
            setArrParameterVisible(false);
          }}
          data={currentParameter}
        />
      )}
    </Drawer>
  );
};

export default Form.create<Props>()(FunctionDefin);
