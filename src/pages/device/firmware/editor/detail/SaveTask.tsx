import React, {useEffect, useState} from 'react';
import Form from 'antd/es/form';
import {FormComponentProps} from 'antd/lib/form';
import {
  Badge,
  Button,
  Card,
  Col,
  Icon,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Radio,
  Row,
  Select,
  Spin,
  Steps
} from 'antd';
import {UpgradeTaskData} from '../../data';
import styles from './style.less';
import apis from '@/services';
import ChoiceDevice from '@/pages/device/firmware/editor/detail/upgrade/ChoiceDevice';
import {getWebsocket} from '@/layouts/GlobalWebSocket';
import encodeQueryParam from '@/utils/encodeParam';
import ChartCard from '@/pages/analysis/components/Charts/ChartCard';
import AutoHide from '@/pages/device/location/info/autoHide';

interface Props extends FormComponentProps {
  close: Function;
  data: Partial<UpgradeTaskData>;
  productId?: string;
  firmwareId?: string;
  appointStep: number
}

interface State {
  currentStep: number;
  upgradeData: Partial<UpgradeTaskData>;
  releaseType: string;
  deviceId: any[];
  taskStatus: any;
}

const topColResponsiveProps = {
  xs: 24,
  sm: 12,
  md: 12,
  lg: 12,
  xl: 6,
  style: {marginBottom: 24},
};

const Save: React.FC<Props> = props => {

  const {
    form: {getFieldDecorator},
    form,
  } = props;

  const initState: State = {
    currentStep: props.appointStep,
    upgradeData: props.data,
    releaseType: 'all',
    deviceId: [],
    taskStatus: {
      waiting: 0,
      waitingSpinning: true,
      processing: 0,
      processingSpinning: true,
      success: 0,
      successSpinning: true,
      failed: 0,
      failedSpinning: true,
    },
  };

  const [currentStep, setCurrentStep] = useState<number>(initState.currentStep);
  const [upgradeData, setUpgradeData] = useState(initState.upgradeData);
  const [releaseType, setReleaseType] = useState(initState.releaseType);
  const [deviceId, setDeviceId] = useState(initState.deviceId);
  const [taskStatus, setTaskStatus] = useState(initState.taskStatus);
  const [spinning, setSpinning] = useState(false);
  const [pushOrSuspend, setPushOrSuspend] = useState(false);
  const [taskByIdPush, setTaskByIdPush] = useState<any>();

  useEffect(() => {
    return () => {
      taskByIdPush && taskByIdPush.unsubscribe();
    };
  }, [taskByIdPush]);

  const taskStatusProcessing = () => {
    apis.firmware._count(
      encodeQueryParam({terms: {taskId: upgradeData.id, state: 'processing'}}),
    ).then((response: any) => {
      if (response.status === 200) {
        taskStatus.processing = response.result;
        taskStatus.processingSpinning = false;
        setTaskStatus({...taskStatus});
      }
    }).catch(() => {
    });
  };

  const taskStatusWaiting = () => {
    apis.firmware._count(
      encodeQueryParam({terms: {taskId: upgradeData.id, state: 'waiting'}}),
    ).then((response: any) => {
      if (response.status === 200) {
        taskStatus.waiting = response.result;
        taskStatus.waitingSpinning = false;
        setTaskStatus({...taskStatus});
      }
    }).catch(() => {
    });
  };

  const taskStatusFailed = () => {
    apis.firmware._count(
      encodeQueryParam({terms: {taskId: upgradeData.id, state: 'failed'}}),
    ).then((response: any) => {
      if (response.status === 200) {
        taskStatus.failed = response.result;
        taskStatus.failedSpinning = false;
        setTaskStatus({...taskStatus});
      }
    }).catch(() => {
    });
  };

  const taskStatusSuccess = () => {
    apis.firmware._count(
      encodeQueryParam({terms: {taskId: upgradeData.id, state: 'success'}}),
    ).then((response: any) => {
      if (response.status === 200) {
        taskStatus.success = response.result;
        taskStatus.successSpinning = false;
        setTaskStatus({...taskStatus});
      }
    }).catch(() => {
    });
  };

  useEffect(() => {
    if (currentStep === 2) {
      taskStatusWaiting();
      taskStatusProcessing();
      taskStatusSuccess();
      taskStatusFailed();
    }
  }, [currentStep]);

  const submitData = () => {
    form.validateFields((err, fileValue) => {
      if (err) return;

      let params = {
        ...fileValue,
        id: upgradeData.id,
        productId: props.productId,
        firmwareId: props.firmwareId,
      };
      if (upgradeData.id) {
        apis.firmware.updateUpgrade(params)
          .then((response: any) => {
            if (response.status === 200) {
              message.success('????????????');
              setSpinning(false);
              if (props.data.id) {
                setCurrentStep(2);
              } else {
                setCurrentStep(Number(currentStep + 1));
              }
            }
          }).catch(() => {
        });
      } else {
        apis.firmware.saveUpgrade(params)
          .then((response: any) => {
            if (response.status === 200) {
              message.success('????????????');
              setUpgradeData(response.result);
              setSpinning(false);
              setCurrentStep(Number(currentStep + 1));
            }
          }).catch(() => {
        });
      }
    });
  };

  const taskRelease = () => {

    if (releaseType === '' || releaseType === null) {
      message.error('?????????????????????');
      setSpinning(false);
      return;
    }
    if (releaseType === 'all') {
      apis.firmware._deployAll(upgradeData.id)
        .then((response: any) => {
          if (response.status === 200) {
            message.success('??????????????????');
            setSpinning(false);
            setCurrentStep(Number(currentStep + 1));
          }
        }).catch(() => {
      });
    } else {
      apis.firmware._deploy(deviceId, upgradeData.id)
        .then((response: any) => {
          if (response.status === 200) {
            message.success('??????????????????');
            setSpinning(false);
            setCurrentStep(Number(currentStep + 1));
          }
        }).catch(() => {
      });
    }
  };

  const taskPush = () => {
    if (taskByIdPush) {
      taskByIdPush.unsubscribe();
    }
    let taskPush = getWebsocket(
      `firmware-push-upgrade-by-taskId`,
      `/device-firmware/publish`,
      {
        taskId: upgradeData.id,
      },
    ).subscribe(() => {
      taskStatus.processing = (taskStatus.processing + 1);
      taskStatus.waiting = (taskStatus.waiting - 1);
      setTaskStatus({...taskStatus});
    });
    setTaskByIdPush(taskPush);
  };

  return (
    <Card style={{padding: 5}}>
      <Steps current={currentStep} size="small" className={styles.steps} style={{paddingBottom: 24}}>
        <Steps.Step title="????????????"/>
        <Steps.Step title="????????????"/>
        <Steps.Step title="??????"/>
      </Steps>
      <Spin spinning={spinning}>
        <div>
          {currentStep === 0 && (
            <Form labelCol={{span: 9}} wrapperCol={{span: 7}} key="firmwareForm">
              <Form.Item key="name" label="????????????">
                {getFieldDecorator('name', {
                  rules: [
                    {required: true, message: '?????????????????????'},
                    {max: 200, message: '?????????????????????200?????????'}
                  ],
                  initialValue: upgradeData.name,
                })(<Input placeholder="??????????????????"/>)}
              </Form.Item>
              <Form.Item key="timeoutSeconds" label="????????????">
                {getFieldDecorator('timeoutSeconds', {
                  rules: [{required: true, message: '?????????????????????'}],
                  initialValue: upgradeData.timeoutSeconds,
                })(<InputNumber min={0} step={1} style={{width:'100%'}} placeholder="?????????????????????"/>)}
              </Form.Item>
              <Form.Item key="mode" label="????????????">
                {getFieldDecorator('mode', {
                  rules: [{required: true, message: '??????????????????'}],
                  initialValue: upgradeData.mode?.value,
                })(<Select placeholder="??????????????????">
                  <Select.Option value='push'>????????????</Select.Option>
                  <Select.Option value='pull'>????????????</Select.Option>
                </Select>)}
              </Form.Item>
              <Form.Item label="??????">
                {getFieldDecorator('description', {
                  initialValue: upgradeData.description,
                })(<Input.TextArea rows={4}/>)}
              </Form.Item>
            </Form>
          )}

          {currentStep === 1 && (
            <div>
              <Form labelCol={{span: 4}} wrapperCol={{span: 17}} key="releaseForm">
                <Form.Item key="releaseType" label="????????????">
                  {getFieldDecorator('releaseType', {
                    rules: [{required: true, message: '??????????????????'}],
                    initialValue: releaseType,
                  })(
                    <Radio.Group buttonStyle="solid" onChange={(event) => {
                      setReleaseType(event.target.value);
                    }}>
                      <Radio.Button value="all">????????????</Radio.Button>
                      <Radio.Button value="part">????????????</Radio.Button>
                    </Radio.Group>,
                  )}
                </Form.Item>
              </Form>
              {releaseType === 'part' && (
                <Form.Item labelCol={{span: 4}} wrapperCol={{span: 17}} label='????????????'>
                  <Card style={{maxHeight: 500, overflowY: 'auto', overflowX: 'hidden'}}>
                    <ChoiceDevice productId={props.productId} save={(item: any[]) => {
                      setDeviceId(item);
                    }}/>
                  </Card>
                </Form.Item>
              )}
            </div>
          )}
          {currentStep === 2 && (
            <div style={{padding: '0 15% 0 15%'}}>
              <Row gutter={24}>
                <Col {...topColResponsiveProps}>
                  <Spin spinning={taskStatus.waitingSpinning}>
                    <ChartCard title={<Badge status="warning" text='????????????'/>}
                               total={<AutoHide title={taskStatus.waiting} style={{width: '313%'}}/>}
                               action={
                                 <div>
                                   <Icon title='??????' type="sync" onClick={() => {
                                     taskStatus.waitingSpinning = true;
                                     setTaskStatus({...taskStatus});
                                     taskStatusWaiting();
                                   }}/>
                                 </div>
                               }
                    >
                      <a style={{float: 'right', marginLeft: 8}}
                         onClick={() => {
                           props.close({type: 'history', taskId: props.data.id, state: 'waiting'});
                         }}>
                        ??????
                      </a>
                      {upgradeData.mode?.value === 'push' && (
                        <>
                          {pushOrSuspend ? (
                            <Popconfirm title="????????????????????????????????????????????????" onConfirm={() => {
                              taskByIdPush && taskByIdPush.unsubscribe();
                              setPushOrSuspend(false);
                              message.success('?????????');
                            }}>
                              <a style={{float: 'right'}}>
                                ????????????
                              </a>
                            </Popconfirm>
                          ) : (
                            <Popconfirm title="??????????????????????????????????????????????????????" onConfirm={() => {
                              setPushOrSuspend(true);
                              taskPush();
                            }}>
                              <a style={{float: 'right'}}>
                                ????????????
                              </a>
                            </Popconfirm>
                          )}
                        </>
                      )}
                    </ChartCard>
                  </Spin>
                </Col>
                <Col {...topColResponsiveProps}>
                  <Spin spinning={taskStatus.processingSpinning}>
                    <ChartCard title={<Badge status="processing" text='?????????'/>}
                               total={<AutoHide title={taskStatus.processing} style={{width: '313%'}}/>}
                               action={
                                 <div>
                                   <Icon title='??????' type="sync" onClick={() => {
                                     taskStatus.processingSpinning = true;
                                     setTaskStatus({...taskStatus});
                                     taskStatusProcessing();
                                   }}/>
                                 </div>
                               }
                    >
                      <a style={{float: 'right'}}
                         onClick={() => {
                           props.close({type: 'history', taskId: props.data.id, state: 'processing'});
                         }}>
                        ??????
                      </a>
                    </ChartCard>
                  </Spin>
                </Col>
                <Col {...topColResponsiveProps}>
                  <Spin spinning={taskStatus.successSpinning}>
                    <ChartCard title={<Badge status="success" text='????????????'/>}
                               total={<AutoHide title={taskStatus.success} style={{width: '313%'}}/>}
                               action={
                                 <div>
                                   <Icon title='??????' type="sync" onClick={() => {
                                     taskStatus.successSpinning = true;
                                     setTaskStatus({...taskStatus});
                                     taskStatusSuccess();
                                   }}/>
                                 </div>
                               }
                    >
                      <a style={{float: 'right'}}
                         onClick={() => {
                           props.close({type: 'history', taskId: props.data.id, state: 'success'});
                         }}>
                        ??????
                      </a>
                    </ChartCard>
                  </Spin>
                </Col>
                <Col {...topColResponsiveProps}>
                  <Spin spinning={taskStatus.failedSpinning}>
                    <ChartCard title={<Badge status="error" text='????????????'/>}
                               total={<AutoHide title={taskStatus.failed} style={{width: '313%'}}/>}
                               action={
                                 <div>
                                   <Icon title='??????' type="sync" onClick={() => {
                                     taskStatus.failedSpinning = true;
                                     setTaskStatus({...taskStatus});
                                     taskStatusFailed();
                                   }}/>
                                 </div>
                               }
                    >
                      <a style={{float: 'right'}}
                         onClick={() => {
                           props.close({type: 'history', taskId: props.data.id, state: 'failed'});
                         }}>
                        ??????
                      </a>
                    </ChartCard>
                  </Spin>
                </Col>
              </Row>
            </div>
          )}

          <div style={{textAlign: 'center'}}>
            {currentStep === 0 ? (<Button onClick={() => {
              props.close({type: 'task'});
            }}>
              ??????
            </Button>) : (<Button onClick={() => {
                setCurrentStep(Number(currentStep - 1));
              }}>
                ?????????
              </Button>
            )}
            {currentStep === 2 ? (
              <Button type="primary" style={{marginLeft: 8}} onClick={() => {
                props.close({type: 'task'});
              }}>
                ??????
              </Button>
            ) : (<Button type="primary" style={{marginLeft: 8}} onClick={() => {
              setSpinning(true);
              if (currentStep === 0) {
                submitData();
              } else {
                taskRelease();
              }
            }}>
              ?????????
            </Button>)}
          </div>
        </div>
      </Spin>
    </Card>
  );
};

export default Form.create<Props>()(Save);
