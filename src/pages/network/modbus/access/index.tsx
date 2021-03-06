import SearchForm from "@/components/SearchForm";
import { getWebsocket } from "@/layouts/GlobalWebSocket";
import AutoHide from "@/pages/analysis/components/Hide/autoHide";
import apis from "@/services";
import encodeQueryParam from "@/utils/encodeParam";
import { PageHeaderWrapper } from "@ant-design/pro-layout"
import { Badge, Button, Card, Divider, Empty, Icon, message, Popconfirm, Spin, Table, Tabs } from "antd"
import { PaginationConfig } from "antd/lib/pagination";
import _ from "lodash";
import React, { useEffect, useRef, useState } from "react"
import AddPoint from '../add-point'
import ChoiceDevice from '../bind-device'
import styles from './index.less'

interface Props {
    location: Location;
}

const Access = (props: Props) => {
    const {
        location: { pathname },
    } = props;
    const id = (pathname.split('/') || []).pop() || '';
    const [spinning, setSpinning] = useState<boolean>(false);
    const [visible, setVisible] = useState<boolean>(false);
    const [bindVisible, setBindVisible] = useState<boolean>(false);
    const [deviceList, setDeviceList] = useState<any[]>([]);
    const [device, setDevice] = useState<any>({});
    const [current, setCurrent] = useState<any>({});
    const [properties$, setProperties$] = useState<any>();
    const [searchParams, setSearchParams] = useState<any>({ pageSize: 10, pageIndex: 0 })
    const [dataSource, setDataSource] = useState<any>({
        data: []
    })
    const wsCallback = useRef();

    const propertiesWs = (deviceId: string, result: any) => {
        if (properties$) {
            properties$.unsubscribe();
        }
        const points: any[] = _.map(result.data, 'metadataId')
        const propertiesWs = getWebsocket(
            `instance-info-property-${deviceId}-${device.productId}-${points.join("-")}`,
            `/dashboard/device/${device.productId}/properties/realTime`,
            {
                deviceId,
                properties: points,
                history: 1,
            },
        ).subscribe((resp: any) => {
            const { payload } = resp;
            const resultList = [...result.data];
            resultList.map((item: any) => {
                if (payload.value.property === item.metadataId) {
                    return {
                        ...item, 
                        value: payload.value.formatValue
                    }
                }
                return item
            })
            setDataSource({
                data: [...resultList],
                pageIndex: result.pageIndex,
                pageSize: result.pageSize,
                total: result.total
            })
        },
                () => { setDataSource(result) },
                () => { setDataSource(result) });
            setProperties$(propertiesWs);
    };

    const queryMetadataList = (device: any, params: any) => {
        apis.modbus.queryMetadataConfig(id, device.id, params).then(resp => {
            if (resp.status === 200) {
                setDataSource(resp.result)
                propertiesWs(device.id, resp.result);
            }
        })
    }

    const queryDeviceList = (masterId: string) => {
        setSpinning(true)
        apis.deviceInstance.queryNoPagin(encodeQueryParam({
            terms: {
                'id$modbus-master': masterId
            }
        })).then(resp => {
            setSpinning(false)
            if (resp.status === 200) {
                setDeviceList(resp.result)
                if (resp.result[0]?.id) {
                    setDevice(resp?.result[0])
                    queryMetadataList(resp?.result[0], searchParams)
                }
            }
        })
    }

    useEffect(() => {
        if (pathname.indexOf('modbus') > 0) {
            queryDeviceList(id)
        }
    }, [])

    useEffect(() => {
        wsCallback.current = properties$;
    })

    useEffect(() => {
        return () => {
            const properties = wsCallback.current;
            properties && properties?.unsubscribe();
        }
    }, []);

    const statusMap = new Map();
    statusMap.set('enabled', 'success');
    statusMap.set('disabled', 'error');

    const columns = [
        {
            title: '??????ID',
            dataIndex: 'metadataId',
            key: 'metadataId',
        },
        {
            title: '?????????',
            dataIndex: 'function.text',
            key: 'function.text',
        },
        {
            title: '??????????????????',
            dataIndex: 'address',
            key: 'address',
        },
        {
            title: '????????????',
            dataIndex: 'readLength',
            key: 'readLength',
        },
        {
            title: '???',
            dataIndex: 'value',
            key: 'value',
        },
        {
            title: '??????',
            dataIndex: 'state',
            key: 'state',
            render: (record: any) =>
                record ? <Badge status={statusMap.get(record.value)} text={record.text} /> : '',
        },
        {
            title: '??????',
            key: 'action',
            render: (text: any, record: any) => (
                <span>
                    <a onClick={() => {
                        setCurrent(record)
                        setVisible(true)
                    }}>??????</a>
                    <Divider type="vertical" />
                    <Popconfirm title={`??????${record.state.value === 'enabled' ? '??????' : '??????'}`}
                        onConfirm={() => {
                            const data = {
                                ...record,
                                state: record.state.value === 'enabled' ? 'disabled' : 'enabled'
                            }
                            apis.modbus.saveMetadataConfig(id, device.id, data).then(resp => {
                                if (resp.status === 200) {
                                    message.success('???????????????')
                                    queryMetadataList(device.id, searchParams)
                                }
                            })
                        }}
                    >
                        <a>{record.state.value === 'enabled' ? '??????' : '??????'}</a>
                    </Popconfirm>
                    <Divider type="vertical" />
                    <Popconfirm title="????????????" onConfirm={() => {
                        apis.modbus.removeMetadataConfig(record.id).then(resp => {
                            if (resp.status === 200) {
                                message.success('???????????????')
                                queryMetadataList(device.id, searchParams)
                            }
                        })
                    }}>
                        <a>??????</a>
                    </Popconfirm>
                </span>
            ),
        }
    ];

    const onTableChange = (
        pagination: PaginationConfig
    ) => {
        queryMetadataList(device.id, {
            pageIndex: Number(pagination.current) - 1,
            pageSize: pagination.pageSize,
            terms: searchParams?.terms
        });
    };

    return (
        <Spin spinning={spinning}>
            <PageHeaderWrapper title="????????????">
                <Card bordered={false}>
                    <div style={{ marginBottom: '10px' }}>
                        <Button type="primary" onClick={() => {
                            setBindVisible(true)
                        }}>????????????</Button>
                    </div>
                    {
                        deviceList.length > 0 ? <Tabs defaultActiveKey={device.id} tabPosition={'left'} style={{ height: 700 }} onChange={(e) => {
                            setSearchParams({ pageSize: 10, pageIndex: 0 })
                            const data = deviceList.find(item => item.id === e)
                            if (data) {
                                queryMetadataList(data, { pageSize: 10, pageIndex: 0 })
                                setDevice(data)
                            }
                        }}>
                            {
                                deviceList.map(item => (
                                    <Tabs.TabPane tab={
                                        <div className={styles.left}>
                                            <div style={{ width: '100px', textAlign: 'left' }}><AutoHide title={item.name} style={{ width: '95%' }} /></div>
                                            <Popconfirm title='???????????????' onConfirm={() => {
                                                apis.modbus.unbindDevice(id, [item.id]).then(resp => {
                                                    if (resp.status === 200) {
                                                        message.success('???????????????')
                                                        queryDeviceList(id)
                                                    }
                                                })
                                            }}>
                                                <Icon className={styles.icon} type="disconnect" />
                                            </Popconfirm>
                                        </div>
                                    } key={item.id}>
                                        <SearchForm
                                            search={(params: any) => {
                                                if (params) {
                                                    const terms: any[] = []
                                                    Object.keys(params).forEach(key => {
                                                        if (params[key]) {
                                                            terms.push(
                                                                {
                                                                    "terms": [
                                                                        {
                                                                            "column": key,
                                                                            "value": `%${params[key]}%`,
                                                                            "termType": "like"
                                                                        }
                                                                    ]
                                                                }
                                                            )
                                                        }
                                                    })
                                                    setSearchParams({ pageSize: 10, pageIndex: 0, terms })
                                                    queryMetadataList(device.id, { pageSize: 10, pageIndex: 0, terms })
                                                } else {
                                                    setSearchParams({ pageSize: 10, pageIndex: 0 })
                                                    queryMetadataList(device.id, { pageSize: 10, pageIndex: 0 })
                                                }
                                            }}
                                            formItems={[{
                                                label: '??????ID',
                                                key: 'metadataId',
                                                type: 'string',
                                            }]}
                                        />
                                        <div style={{ margin: '10px 0' }}><Button type="primary" onClick={() => {
                                            setVisible(true)
                                            setCurrent({})
                                        }}>???????????????</Button></div>
                                        <Table dataSource={dataSource?.data || []} columns={columns} rowKey="id"
                                            onChange={onTableChange}
                                            pagination={{
                                                current: dataSource.pageIndex + 1,
                                                total: dataSource.total,
                                                pageSize: dataSource.pageSize || 10,
                                                showQuickJumper: true,
                                                showSizeChanger: true,
                                                pageSizeOptions: ['10', '20', '50', '100'],
                                                showTotal: (total: number) =>
                                                    `??? ${total} ????????? ???  ${dataSource.pageIndex + 1}/${Math.ceil(
                                                        dataSource.total / dataSource.pageSize,
                                                    )}???`,
                                            }} />
                                    </Tabs.TabPane>
                                ))
                            }
                        </Tabs> : <Empty />
                    }
                </Card>
                {
                    visible && <AddPoint masterId={id} deviceId={device.id} close={() => {
                        setVisible(false)
                        queryMetadataList(device.id, searchParams)
                    }} data={current} />
                }
                {
                    bindVisible && <ChoiceDevice masterId={id} save={(data: string[]) => {
                        setBindVisible(false)
                        if (Array.isArray(data) && data.length > 0) {
                            apis.modbus.bindDevice(id, data).then(resp => {
                                if (resp.status === 200) {
                                    message.success('???????????????')
                                    queryDeviceList(id)
                                }
                            })
                        }
                    }} />
                }
            </PageHeaderWrapper>
        </Spin>
    )
}

export default Access