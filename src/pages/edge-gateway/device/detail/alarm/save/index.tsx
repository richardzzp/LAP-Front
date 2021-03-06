import React, { useEffect, useState } from 'react';
import Form from 'antd/es/form';
import { FormComponentProps } from 'antd/lib/form';
import { Button, Card, Col, Icon, Input, Modal, Row, Radio, Switch, Tooltip, Select, message } from 'antd';
import { alarm } from '../data';
import Service from '../service';
import Triggers from './triggers';
import Bind from '../../rule-engine/scene-save/bind';
import ActionAssembly from './actions';

interface Props extends FormComponentProps {
  close: Function;
  save: Function;
  data: Partial<alarm>,
  deviceId: string;
}

interface State {
  properties: any[];
  data: Partial<alarm>;
  trigger: any[];
  action: any[];
  shakeLimit: any;
  alarmType: string;
  deviceList: any[];
  name: string;
  productId: string;
  deviceId: string;
  productList: any[];
  device: any;
  product: any;
}

const AlarmSave: React.FC<Props> = props => {
  const service = new Service('rule-engine-alarm');
  const initState: State = {
    properties: [],
    data: props.data,
    trigger: [],
    action: [],
    shakeLimit: {},
    alarmType: props.data.target || 'product',
    deviceList: [],
    name: props.data.name || '',
    deviceId: props.data.target === 'device' && props.data.targetId ? props.data.targetId : '',
    productId: props.data.targetId || '',
    productList: [],
    device: {},
    product: {},
  };

  const [data] = useState(initState.data);
  const [alarmType, setAlarmType] = useState(initState.alarmType);
  const [properties, setProperties] = useState(initState.properties);
  const [trigger, setTrigger] = useState(initState.trigger);
  const [action, setAction] = useState(initState.action);
  const [bindVisible, setBindVisible] = useState(false);
  const [shakeLimit, setShakeLimit] = useState(initState.shakeLimit);
  // const [deviceList, setDeviceList] = useState(initState.deviceList);
  const [productList, setProductList] = useState(initState.productList);
  const [name, setName] = useState(initState.name);
  const [deviceId, setDeviceId] = useState(initState.deviceId);
  const [productId, setProductId] = useState(initState.productId);
  const [device, setDevice] = useState(initState.device);
  const [product, setProduct] = useState(initState.product);

  const submitData = () => {
    data.name = name;
    data.target = alarmType;
    if (alarmType === 'device') {
      data.targetId = deviceId;
      data.alarmRule = {
        name: device.name,
        deviceId: device.id,
        deviceName: device.name,
        triggers: trigger,
        actions: action,
        properties: properties,
        productId: device.productId,
        productName: device.productName,
        shakeLimit: shakeLimit,
      };
    } else {
      data.targetId = productId;
      data.alarmRule = {
        name: product.name,
        productId: product.id,
        productName: product.name,
        triggers: trigger,
        actions: action,
        properties: properties,
        shakeLimit: shakeLimit,
      };
    }
    data.state = undefined;
    props.save({ ...data });
  };

  // const getDeviceList = () => {
  //   service.getDeviceList(props.deviceId, { paging: false }).subscribe(
  //     (res) => {
  //       setDeviceList(res.data)
  //     }
  //   )
  // }
  const getProductList = () => {
    service.getProductList(props.deviceId, { paging: false }).subscribe(
      (res) => {
        setProductList(res)
      }
    )
  }

  const getProductInfo = (id: string) => {
    service.getProductInfo(props.deviceId, { id: id }).subscribe(
      res => {
        setProduct(res);
      }
    )
  }

  const getInstanceDetail = (id: string) => {
    service.getInstanceDetail(props.deviceId, id).subscribe(
      (res) => {
        setDevice(res);
      }
    )
  }

  useEffect(() => {
    if(deviceId !== ''){
      getInstanceDetail(deviceId);
    }
    if(productId !== ''){
      getProductInfo(productId);
    }
    getProductList();
    if (props.data.alarmRule) {
      setShakeLimit(props.data.alarmRule.shakeLimit ? props.data.alarmRule.shakeLimit : {
        enabled: false,
        time: undefined,
        threshold: undefined,
        alarmFirst: true
      });
      setTrigger(props.data.alarmRule.triggers.length > 0 ? [...props.data.alarmRule.triggers] : [{ _id: 0 }]);
      setAction(props.data.alarmRule.actions.length > 0 ? [...props.data.alarmRule.actions] : [{ _id: 0 }]);
      setProperties(props.data.alarmRule.properties.length > 0 ? [...props.data.alarmRule.properties] : [{ _id: 0 }]);
    } else {
      setTrigger([{ _id: 0 }]);
      setAction([{ _id: 0 }]);
      setProperties([{ _id: 0 }]);
    }
  }, []);

  const removeProperties = (val: number) => {
    properties.splice(val, 1);
    setProperties([...properties]);
  };

  return (
    <Modal
      title={`${props.data?.id ? '??????' : '??????'}??????1`}
      visible
      okText="??????"
      cancelText="??????"
      onOk={() => {
        submitData();
      }}
      style={{ marginTop: '-3%' }}
      width="70%"
      onCancel={() => props.close()}
    >
      <div style={{ maxHeight: 750, overflowY: 'auto', overflowX: 'hidden' }}>
        <Form wrapperCol={{ span: 20 }} labelCol={{ span: 4 }} key='addAlarmForm'>
          <Row gutter={16}
            style={{ marginLeft: '0.1%' }}>
            <Col span={12}>
              <Form.Item key="name" label="????????????">
                <Input placeholder="??????????????????" defaultValue={props.data.name}
                  onBlur={event => {
                    setName(event.target.value);
                  }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item key="alarmType" label="????????????">
                <Select placeholder="?????????" defaultValue={props.data.target}
                  disabled={!!props.data.id}
                  onChange={(value: string) => {
                    setAlarmType(value);
                  }}
                >
                  <Select.Option key='product' value="product">??????</Select.Option>
                  <Select.Option key='device' value="device">??????</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            {
              alarmType === 'product' && <Col span={12}>
                <Form.Item key="productId" label="??????" >
                  <Select disabled={!!props.data.id} placeholder="?????????" defaultValue={productId} onChange={(value: string) => {
                    setProductId(value);
                    getProductInfo(value);
                  }}>
                    {productList.map((item: any) => {
                      return (
                        <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>
                      )
                    })}
                  </Select>
                </Form.Item>
              </Col>
            }
            {
              alarmType === 'device' && <Col span={12}>
                <Form.Item key="deviceId" label="??????">
                  <Input disabled={!!props.data.id} addonAfter={<Icon onClick={() => {
                    setBindVisible(true);
                  }} type='gold' title="??????????????????" />}
                    defaultValue={deviceId || ''}
                    placeholder="??????????????????"
                    value={device?.name}
                    readOnly />
                  {/* <Select placeholder="?????????" defaultValue={props.data.targetId} onChange={(value: string) => {
                    getInstanceDetail(value);
                  }}>
                    {deviceList.map((item: any) => {
                      return (
                        <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>
                      )
                    })}
                  </Select> */}
                </Form.Item>
              </Col>
            }
          </Row>
          <Card style={{ marginBottom: 10 }} bordered={false} size="small">
            <p style={{ fontSize: 16 }}>????????????
              <Tooltip title="???????????????????????????????????????????????????">
                <Icon type="question-circle-o" style={{ paddingLeft: 10 }} />
              </Tooltip>
              <Switch key='shakeLimit.enabled' checkedChildren="????????????" unCheckedChildren="????????????"
                defaultChecked={shakeLimit.enabled ? shakeLimit.enabled : false}
                style={{ marginLeft: 20 }}
                onChange={(value: boolean) => {
                  shakeLimit.enabled = value;
                  setShakeLimit({ ...shakeLimit })
                }}
              />
              {shakeLimit.enabled && (
                <>
                  <Input style={{ width: 80, marginLeft: 3 }} size='small' key='shakeLimit.time'
                    defaultValue={shakeLimit.time}
                    onBlur={event => {
                      shakeLimit.time = event.target.value;
                    }}
                  />????????????
                  <Input style={{ width: 80 }} size='small' key='shakeLimit.threshold' defaultValue={shakeLimit.threshold}
                    onBlur={event => {
                      shakeLimit.threshold = event.target.value;
                    }}
                  />????????????????????????
                  <Radio.Group defaultValue={shakeLimit.alarmFirst} key='shakeLimit.alarmFirst' size='small'
                    buttonStyle="solid"
                    onChange={event => {
                      shakeLimit.alarmFirst = Boolean(event.target.value);
                    }}
                  >
                    <Radio.Button value={true}>?????????</Radio.Button>
                    <Radio.Button value={false}>????????????</Radio.Button>
                  </Radio.Group>
                </>
              )}
            </p>
            {trigger.map((item: any, index: number) => (
              <div key={index}>
                <Triggers
                  save={(data: any) => {
                    trigger.splice(index, 1, data);
                  }}
                  trigger={item}
                  key={`trigger_${Math.round(Math.random() * 100000)}`}
                  metaData={alarmType === 'product' ? product?.metadata : device?.metadata}
                  position={index}
                  remove={(position: number) => {
                    trigger.splice(position, 1);
                    let data = [...trigger];
                    setTrigger([...data]);
                  }}
                />
              </div>
            ))}
            <Button icon="plus" type="link"
              onClick={() => {
                setTrigger([...trigger, { _id: Math.round(Math.random() * 100000) }]);
              }}
            >
              ???????????????
            </Button>
          </Card>
          <Card style={{ marginBottom: 10 }} bordered={false} size="small">
            <p style={{ fontSize: 16 }}>??????
              <Tooltip title="????????????????????????????????????????????????????????????deviceId ?????? id">
                <Icon type="question-circle-o" style={{ paddingLeft: 10 }} />
              </Tooltip>
            </p>
            <div style={{
              maxHeight: 200,
              overflowY: 'auto',
              overflowX: 'hidden',
              backgroundColor: '#F5F5F6',
              paddingTop: 10,
            }}>
              {properties.map((item: any, index: number) => (
                <Row gutter={16} key={index}
                  style={{ paddingBottom: 10, marginLeft: 13, marginRight: 3 }}>
                  <Col span={6}>
                    <Input placeholder="???????????????" value={item.property}
                      onChange={event => {
                        properties[index].property = event.target.value;
                        setProperties([...properties]);
                      }}
                    />
                  </Col>
                  <Col span={6}>
                    <Input placeholder="???????????????" value={item.alias}
                      onChange={event => {
                        properties[index].alias = event.target.value;
                        setProperties([...properties]);
                      }}
                    />
                  </Col>
                  <Col span={12} style={{ textAlign: 'right', marginTop: 6, paddingRight: 15 }}>
                    <a style={{ paddingTop: 7 }}
                      onClick={() => {
                        removeProperties(index);
                      }}
                    >??????</a>
                  </Col>
                </Row>
              ))}
              <Col span={24} style={{ marginLeft: 20 }}>
                <a onClick={() => {
                  setProperties([...properties, { _id: Math.round(Math.random() * 100000) }]);
                }}>??????</a>
              </Col>
            </div>
          </Card>

          <Card bordered={false} size="small">
            <p style={{ fontSize: 16 }}>????????????</p>
            {action.map((item: any, index) => (
              <ActionAssembly deviceId={props.deviceId} key={index + Math.random()} save={(actionData: any) => {
                action.splice(index, 1, actionData);
              }} action={item} position={index} remove={(position: number) => {
                action.splice(position, 1);
                setAction([...action]);
              }} />
            ))}
            <Button icon="plus" type="link"
              onClick={() => {
                setAction([...action, { _id: Math.round(Math.random() * 100000) }]);
              }}
            >
              ????????????
            </Button>
          </Card>
        </Form>
      </div>
      {bindVisible && (
        <Bind selectionType='radio'
              close={() => {
                setBindVisible(false);
              }}
              deviceId={props.deviceId}
              save={(item: any) => {
                if (item[0]) {
                  setBindVisible(false);
                  getInstanceDetail(item[0]);
                  setDeviceId(item[0]);
                } else {
                  message.error('???????????????');
                  return;
                }
              }}
        />
      )}
    </Modal>
  );
};

export default Form.create<Props>()(AlarmSave);
