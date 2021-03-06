import Form, { FormComponentProps } from 'antd/es/form';
import React, { useContext, useEffect, useState } from 'react';
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
  Menu,
  Dropdown
} from 'antd';
import { EventsMeta, Parameter } from '../data.d';
import styles from '../index.less';
import { renderUnit } from '@/pages/device/public';
import Paramter from '../paramter';
import { ProductContext } from "@/pages/device/product/context";
import apis from "@/services";
interface Props extends FormComponentProps {
  save: Function;
  data: Partial<EventsMeta>;
  close: Function;
  unitsData: any;
}

interface State {
  editVisible: boolean;
  current: Partial<Parameter>;
  data: Partial<EventsMeta>;
  dataType: string;
  enumData: any[];
  parameterVisible: boolean;
  parameter: any[];
  currentParameter: any;
  properties: any[];
  arrayProperties: any[];
  aType: string;
  arrParameterVisible: boolean;
  arrayEnumData: any[];
}

const EventDefin: React.FC<Props> = props => {
  const initState: State = {
    editVisible: false,
    current: {},
    data: props.data || {},
    dataType: props.data.valueType?.type || '',
    enumData: props.data.valueType?.elements || [{ text: '', value: '', id: 0 }],
    properties: props.data.valueType?.properties || [],
    parameterVisible: false,
    currentParameter: {},
    parameter: [],
    aType: props.data.valueType?.elementType?.type || '',
    arrayEnumData: props.data.valueType?.elementType?.elements || [{ text: '', value: '', id: 0 }],
    arrParameterVisible: false,
    arrayProperties: props.data.valueType?.elementType?.properties || [],
  };

  const [properties, setParameter] = useState(initState.properties);
  const [dataType, setDataType] = useState(initState.dataType);
  const [enumData, setEnumData] = useState(initState.enumData);
  const [parameterVisible, setParameterVisible] = useState(initState.parameterVisible);
  const [currentParameter, setCurrentParameter] = useState(initState.currentParameter);
  const [configMetadata, setConfigMetadata] = useState<any[]>([]);
  const [loadConfig, setLoadConfig] = useState<boolean>(false);
  const [aType, setAType] = useState<string>(initState.aType);
  const [arrayProperties, setArrayProperties] = useState(initState.arrayProperties);
  const [arrParameterVisible, setArrParameterVisible] = useState(initState.arrParameterVisible);
  const [arrayEnumData, setArrayEnumData] = useState(initState.arrayEnumData);
  const {
    form: { getFieldDecorator, getFieldsValue },
  } = props;

  const saveData = (onlySave: boolean) => {
    const {
      form,
      // data: { id },
    } = props;
    form.validateFields((err: any, fieldValue: any) => {
      if (err) return;
      // ToDo????????????
      const data = fieldValue;

      const {
        valueType: { type },
      } = fieldValue;

      if (type === 'object') {
        data.valueType.properties = properties;
      } else if (type === 'enum') {
        data.valueType.elements = enumData;
      }
      if (dataType === 'array' && data.valueType.elementType.type === 'object') {
        data.valueType.elementType.properties = arrayProperties;
      }
      props.save({ ...data }, onlySave);
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
              {getFieldDecorator('valueType.scale', {
                initialValue: initState.data.valueType?.scale,
              })(<InputNumber min={0} step={1} placeholder="???????????????" style={{ width: '100%' }} />)}
            </Form.Item>

            <Form.Item label="??????">
              {getFieldDecorator('valueType.unit', {
                initialValue: initState.data.valueType?.unit,
              })(renderUnit(props.unitsData))}
            </Form.Item>
          </div>
        );
      case 'int':
      case 'long':
        return (
          <div>
            {/* <Form.Item label="????????????" style={{ height: 69 }}>
              <Col span={11}>
                {getFieldDecorator('valueType.min', {
                  initialValue: initState.data.valueType?.min,
                })(<InputNumber placeholder="?????????" style={{ width: '100%' }} />)}
              </Col>
              <Col span={2} push={1}>
                ~
              </Col>
              <Col span={11}>
                <Form.Item>
                  {getFieldDecorator('valueType.max', {
                    initialValue: initState.data.valueType?.max,
                  })(<InputNumber placeholder="?????????" style={{ width: '100%' }} />)}
                </Form.Item>
              </Col>
            </Form.Item>

            <Form.Item label="??????">
              {getFieldDecorator('valueType.step', {
                initialValue: initState.data.valueType?.step,
              })(<InputNumber placeholder="???????????????" style={{ width: '100%' }} />)}
            </Form.Item> */}

            <Form.Item label="??????">
              {getFieldDecorator('valueType.unit', {
                initialValue: initState.data.valueType?.unit,
              })(renderUnit(props.unitsData))}
            </Form.Item>
          </div>
        );
      case 'string':
        return (
          <div>
            <Form.Item label="????????????">
              {getFieldDecorator('valueType.expands.maxLength', {
                initialValue: initState.data.valueType?.expands?.maxLength,
              })(<Input />)}
            </Form.Item>
          </div>
        );
      case 'boolean':
        return (
          <div>
            <Form.Item label="?????????" style={{ height: 69 }}>
              <Col span={11}>
                {getFieldDecorator('valueType.trueText', {
                  initialValue: initState.data.valueType?.trueText || '???',
                })(<Input placeholder="trueText" />)}
              </Col>
              <Col span={2} push={1}>
                ~
              </Col>
              <Col span={11}>
                <Form.Item>
                  {getFieldDecorator('valueType.trueValue', {
                    initialValue: initState.data.valueType?.trueValue || true,
                  })(<Input placeholder="trueValue" />)}
                </Form.Item>
              </Col>
            </Form.Item>
            <Form.Item style={{ height: 69 }}>
              <Col span={11}>
                {getFieldDecorator('valueType.falseText', {
                  initialValue: initState.data.valueType?.falseText || '???',
                })(<Input placeholder="falseText" />)}
              </Col>
              <Col span={2} push={1}>
                ~
              </Col>
              <Col span={11}>
                <Form.Item>
                  {getFieldDecorator('valueType.falseValue', {
                    initialValue: initState.data.valueType?.falseValue || false,
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
              {getFieldDecorator('valueType.format', {
                initialValue: initState.data.valueType?.format,
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
              {getFieldDecorator('valueType.elementType.type', {
                initialValue: initState.data.valueType?.elementType.type,
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
            {properties.length > 0 && (
              <List
                bordered
                dataSource={properties}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        onClick={() => {
                          setParameterVisible(true);
                          setCurrentParameter(item);
                        }}
                      >
                        ??????
                      </Button>,
                      <Button
                        type="link"
                        onClick={() => {
                          const index = properties.findIndex((i: any) => i.id === item.id);
                          properties.splice(index, 1);
                          setParameter([...properties]);
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
                setParameterVisible(true);
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
            {getFieldDecorator('valueType.fileType', {
              initialValue: initState.data.valueType?.fileType,
            })(
              <Select>
                <Select.Option value="url">URL(??????)</Select.Option>
                <Select.Option value="base64">Base64(Base64??????)</Select.Option>
                <Select.Option value="binary">Binary(?????????)</Select.Option>
              </Select>,
            )}
          </Form.Item>
        );
      /*case 'geoPoint':
        return (
          <div>
            <Form.Item label="????????????">
              {getFieldDecorator('valueType.latProperty', {
                initialValue: initState.data.valueType?.latProperty,
              })(<Input placeholder="?????????????????????" />)}
            </Form.Item>
            <Form.Item label="????????????">
              {getFieldDecorator('valueType.lonProperty', {
                initialValue: initState.data.valueType?.lonProperty,
              })(<Input placeholder="?????????????????????" />)}
            </Form.Item>
          </div>
        );*/
      case 'password':
        return (
          <div>
            <Form.Item label="????????????">
              {getFieldDecorator('valueType.expands.maxLength', {
                initialValue: initState.data.valueType?.expands?.maxLength,
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
    const data = getFieldsValue(['id', 'valueType.type']);
    if (id) {
      data.id = id;
    }
    if (type) {
      data.valueType.type = type;
    }

    if (data.id && data.valueType.type) {
      setLoadConfig(true);
      apis.deviceProdcut.configMetadata({
        productId: product.id,
        modelType: 'event',
        modelId: data.id,
        typeId: data.valueType.type
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
              <Select.Option value={i.value}>{i.text}</Select.Option>
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
            })(<Input placeholder="?????????????????????" />)}
          </Form.Item>
          {/* <Form.Item label="????????????">
            {getFieldDecorator('expands.eventType', {
              rules: [{ required: true }],
              initialValue: initState.data.expands?.eventType,
            })(
              <Radio.Group>
                <Radio value="reportData">????????????</Radio>
                <Radio value="event">????????????</Radio>
              </Radio.Group>,
            )}
          </Form.Item> */}
          <Form.Item label="????????????">
            {getFieldDecorator('expands.level', {
              rules: [{ required: true }],
              initialValue: initState.data.expands?.level,
            })(
              <Radio.Group>
                <Radio value="ordinary">??????</Radio>
                <Radio value="warn">??????</Radio>
                <Radio value="urgent">??????</Radio>
              </Radio.Group>,
            )}
          </Form.Item>
          <Form.Item label="????????????">
            {getFieldDecorator('valueType.type', {
              rules: [{ required: true, message: '?????????' }],
              initialValue: initState.data.valueType?.type,
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
        {parameterVisible && (
          <Paramter
            data={currentParameter}
            unitsData={props.unitsData}
            save={item => {
              const temp = properties.filter(i => i.id !== item.id);
              setParameter([...temp, item]);
            }}
            close={() => {
              setCurrentParameter({});
              setParameterVisible(false)
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
    </Drawer>
  );
};

export default Form.create<Props>()(EventDefin);
