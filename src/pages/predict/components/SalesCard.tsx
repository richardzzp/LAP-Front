import React, { useEffect, useState } from 'react';
import { Card, Col, DatePicker, Radio, Row, Tabs } from 'antd';
import styles from '../style.less';
import apis from '@/services';
import moment from 'moment';
import { Axis, Chart, Geom, Legend, Tooltip } from "bizcharts";
import {getPredict} from "@/pages/analysis/service";

const { TabPane } = Tabs;

export interface State {
  gatewayDataList: any[];
  ticksDataList: any[];
  currentTime: string;
  time: string;
  selectionTime: string
}

const SalesCard = ({ loading }: { loading: boolean; }) => {
  let gatewayMonitor: (from: string, to: string, time: string) => void;
  const initState: State = {
    gatewayDataList1: [],
    ticksDataList1: [],
    gatewayDataList2: [],
    ticksDataList2: [],
    gatewayDataList3: [],
    ticksDataList3: [],
    currentTime: '',
    time: '',
    selectionTime: '',
  };

  const [gatewayData1, setGatewayData1] = useState(initState.gatewayDataList1);
  const [gatewayData2, setGatewayData2] = useState(initState.gatewayDataList2);
  const [gatewayData3, setGatewayData3] = useState(initState.gatewayDataList3);
  const [ticksDataList1, setTicksDataList1] = useState(initState.ticksDataList1);
  const [ticksDataList2, setTicksDataList2] = useState(initState.ticksDataList2);
  const [ticksDataList3, setTicksDataList3] = useState(initState.ticksDataList3);
  const [time, setTime] = useState(initState.time);
  const [selectionTime, setSelectionTime] = useState(initState.selectionTime);

  const calculationDate = (val: number) => {
    const dd = new Date();
    dd.setDate(dd.getDate() - val);
    return `${dd.getFullYear()}-${(dd.getMonth() + 1) < 10 ? `0${dd.getMonth() + 1}` : (dd.getMonth() + 1)}-${dd.getDate() < 10 ? `0${dd.getDate()}` : dd.getDate()} ${dd.getHours() < 10 ? `0${dd.getHours()}` : dd.getHours()}:${dd.getMinutes() < 10 ? `0${dd.getMinutes()}` : dd.getMinutes()}:${dd.getSeconds() < 10 ? `0${dd.getSeconds()}` : dd.getSeconds()}`;
  };

  const timeMap = {
    '1h': '1m',
    '1d': '24m',
    '7d': '168m',
    '30d': '12h',
  };

  useEffect(() => {
    const da = new Date();
    da.setHours(da.getHours() - 1);
    gatewayMonitor(formatData(da), calculationDate(0), '1m');
    setSelectionTime(calculationDate(0));
    setTime('1m');
  }, []);

  gatewayMonitor = (from: string, to: string, time: string) => {


    apis.analysis.getPredict()
      .then((response: any) => {
        const tempResult = response?.result;
        if (response.status === 200) {
          const dataList1: any[] = [];
          const ticksList1: any[] = [];
          tempResult.airTemperature.forEach((item: any) => {
            dataList1.push({
              year: item.data.timeString,
              value: item.data.value,
              type: '温度'
            });
            if (item.data.timestamp % 2 === 0 && item.data.timestamp !== 0) {
              ticksList1.push(item.data.timeString);
            }
          });
          setTicksDataList1(ticksList1);
          setGatewayData1(dataList1);
          //湿球
          const dataList2: any[] = [];
          const ticksList2: any[] = [];
          tempResult.wetBulbTemperature.forEach((item: any) => {
            dataList2.push({
              year: item.data.timeString,
              value: item.data.value,
              type: '温度'
            });
            if (item.data.timestamp % 2 === 0 && item.data.timestamp !== 0) {
              ticksList2.push(item.data.timeString);
            }
          });
          setTicksDataList2(ticksList2);
          setGatewayData2(dataList2);
          //太阳辐射
          const dataList3: any[] = [];
          const ticksList3: any[] = [];
          tempResult.solarRadiation.forEach((item: any) => {
            dataList3.push({
              year: item.data.timeString,
              value: item.data.value,
              type: ''
            });
            if (item.data.timestamp % 2 === 0 && item.data.timestamp !== 0) {
              ticksList3.push(item.data.timeString);
            }
          });
          setTicksDataList3(ticksList3);
          setGatewayData3(dataList3);
        }
      });
  };


  const formatData = (value: string) => {
    const dd = new Date(value);
    return `${dd.getFullYear()}-${(dd.getMonth() + 1) < 10 ? `0${dd.getMonth() + 1}` : (dd.getMonth() + 1)}-${dd.getDate() < 10 ? `0${dd.getDate()}` : dd.getDate()} ${dd.getHours() < 10 ? `0${dd.getHours()}` : dd.getHours()}:${dd.getMinutes() < 10 ? `0${dd.getMinutes()}` : dd.getMinutes()}:${dd.getSeconds() < 10 ? `0${dd.getSeconds()}` : dd.getSeconds()}`;
  };


  return (
    <Card loading={loading} bordered={false} bodyStyle={{ padding: 0 }}>
      <div className={styles.salesCard}>
        <Tabs
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
        >
          <TabPane tab='空气温度' key="1">
            <Row>
              <Col>
                <div className={styles.salesBar}>
                  <Chart
                    height={400}
                    data={gatewayData1}
                    scale={{
                      value: { min: 0 },
                      year: {
                        range: [0, 1],
                        ticks: ticksDataList1,
                      },
                    }}
                    forceFit
                  >
                    <Axis name="year" />
                    <Axis name="value" label={{
                      formatter: val => parseFloat(val).toLocaleString()
                    }} />
                    <Legend />
                    <Tooltip crosshairs={{ type: 'y' }} />
                    <Geom type="line" position="year*value*type" size={2}
                      tooltip={[
                        "year*value*type",
                        (year, value, type) => ({
                          title: year,
                          name: type,
                          value: parseFloat(value).toLocaleString()
                        })
                      ]}
                    />
                    <Geom
                      type="area"
                      position="year*value*type"
                      shape={'circle'}
                      tooltip={[
                        "year*value*type",
                        (year, value, type) => ({
                          title: year,
                          name: type,
                          value: parseFloat(value).toLocaleString()
                        })
                      ]}
                    />
                  </Chart>
                </div>
              </Col>
            </Row>
          </TabPane>
          <TabPane tab='湿球温度' key="2">
            <Row>
              <Col>
                <div className={styles.salesBar}>
                  <Chart
                    height={400}
                    data={gatewayData2}
                    scale={{
                      value: { min: 0 },
                      year: {
                        range: [0, 1],
                        ticks: ticksDataList2,
                      },
                    }}
                    forceFit
                  >
                    <Axis name="year" />
                    <Axis name="value" label={{
                      formatter: val => parseFloat(val).toLocaleString()
                    }} />
                    <Legend />
                    <Tooltip crosshairs={{ type: 'y' }} />
                    <Geom type="line" position="year*value*type" size={2}
                          tooltip={[
                            "year*value*type",
                            (year, value, type) => ({
                              title: year,
                              name: type,
                              value: parseFloat(value).toLocaleString()
                            })
                          ]}
                    />
                    <Geom
                      type="area"
                      position="year*value*type"
                      shape={'circle'}
                      tooltip={[
                        "year*value*type",
                        (year, value, type) => ({
                          title: year,
                          name: type,
                          value: parseFloat(value).toLocaleString()
                        })
                      ]}
                    />
                  </Chart>
                </div>
              </Col>
            </Row>
          </TabPane>
          <TabPane tab='太阳辐射' key="3">
            <Row>
              <Col>
                <div className={styles.salesBar}>
                  <Chart
                    height={400}
                    data={gatewayData3}
                    scale={{
                      value: { min: 0 },
                      year: {
                        range: [0, 1],
                        ticks: ticksDataList3,
                      },
                    }}
                    forceFit
                  >
                    <Axis name="year" />
                    <Axis name="value" label={{
                      formatter: val => parseFloat(val).toLocaleString()
                    }} />
                    <Legend />
                    <Tooltip crosshairs={{ type: 'y' }} />
                    <Geom type="line" position="year*value*type" size={2}
                          tooltip={[
                            "year*value*type",
                            (year, value, type) => ({
                              title: year,
                              name: type,
                              value: parseFloat(value).toLocaleString()
                            })
                          ]}
                    />
                    <Geom
                      type="area"
                      position="year*value*type"
                      shape={'circle'}
                      tooltip={[
                        "year*value*type",
                        (year, value, type) => ({
                          title: year,
                          name: type,
                          value: parseFloat(value).toLocaleString()
                        })
                      ]}
                    />
                  </Chart>
                </div>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </div>
    </Card>
  );
};

export default SalesCard;
