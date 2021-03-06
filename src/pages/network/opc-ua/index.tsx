import React, { Fragment, useEffect, useRef, useState } from 'react';
import { PaginationConfig } from 'antd/es/table';
import { Card, Table, Badge, Tree, Divider, Button, message, Popconfirm, Spin, Dropdown, Icon, Menu, Modal, Tooltip, List } from 'antd';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import styles from '@/utils/table.less';
import style from './index.less';
import apis from '@/services';
import encodeQueryParam from '@/utils/encodeParam';
import ChannelSave from './save/channel-save';
import BindSave from './save/bind-save';
import PointSave from './save/point-save';
import Import from './operation/import';
import Export from './operation/export';
import BindDevice from './operation/bind-device';
import SearchForm from '@/components/SearchForm';
import { getWebsocket } from '@/layouts/GlobalWebSocket';

interface Props {
    certificate: any;
    location: Location;
    loading: boolean;
}

interface State {
    searchParam: any;
    searchPointParam: any;
    channelSaveVisible: boolean;
    bindSaveVisible: boolean;
    pointSaveVisible: boolean;
    pointVisible: boolean;
    bindDeviceVisible: boolean;
    currentChannel: any;
    currentBind: any;
    currentPoint: any;
    result: any;
    resultPoint: any;
    dataListNoPaing: any[];
    opcId: string;
    deviceId: string;
    deviceBindId: string;
    propertyList: any[];
    selectedRowKeys: any[];
    device: any;
}

const OpcUaComponent: React.FC<Props> = props => {

    const initState: State = {
        searchParam: { pageSize: 10 },
        searchPointParam: { pageSize: 10, sorts: { field: 'property', order: 'desc' } },
        pointVisible: false,
        bindSaveVisible: false,
        pointSaveVisible: false,
        channelSaveVisible: false,
        bindDeviceVisible: false,
        currentChannel: {},
        currentBind: {},
        currentPoint: {},
        result: {},
        resultPoint: {},
        dataListNoPaing: [],
        opcId: '',
        deviceId: '',
        deviceBindId: '',
        propertyList: [],
        selectedRowKeys: [],
        device: {}
    };

    const [searchParam, setSearchParam] = useState(initState.searchParam);
    const [searchPointParam, setSearchPointParam] = useState(initState.searchPointParam);
    const [result, setResult] = useState(initState.result);
    const [resultPoint, setResultPoint] = useState(initState.resultPoint);
    const [pointVisible, setPointVisible] = useState(initState.pointVisible);
    const [channelSaveVisible, setChannelSaveVisible] = useState(initState.channelSaveVisible);
    const [bindSaveVisible, setBindSaveVisible] = useState(initState.bindSaveVisible);
    const [pointSaveVisible, setPointSaveVisible] = useState(initState.pointSaveVisible);
    const [bindDeviceVisible, setBindDeviceVisible] = useState(initState.bindDeviceVisible);
    const [currentChannel, setCurrentChannel] = useState(initState.currentChannel);
    const [currentBind, setCurrentBind] = useState(initState.currentBind);
    const [currentPoint, setCurrentPoint] = useState(initState.currentPoint);
    const [dataListNoPaing, setDataListNoPaing] = useState(initState.dataListNoPaing);
    const [opcId, setOpcId] = useState(initState.opcId);
    const [device, setDevice] = useState(initState.device);
    const [deviceId, setDeviceId] = useState(initState.deviceId);
    const [deviceBindId, setDeviceBindId] = useState(initState.deviceBindId);
    const [importVisible, setImportVisible] = useState(false);
    const [exportVisible, setExportVisible] = useState(false);
    const [treeNode, setTreeNode] = useState<any>({});
    const [spinning, setSpinning] = useState(true);
    const [properties$, setProperties$] = useState<any>();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const wsCallback = useRef();

    const getListNoPaging = (id?: string) => {
        setSpinning(true);
        apis.opcUa.listNoPaging(encodeQueryParam({ //????????????
            sorts: { field: 'name', order: 'desc' }
        })).then((res: any) => {
            if (res.status === 200) {
                let data: any[] = [];
                if (res.result.length > 0) {
                    res.result.map((item: any) => {
                        data.push({
                            key: item.id,
                            title: rendertitle(item),
                            isLeaf: false,
                            children: [],
                            id: item.id
                        })
                    })
                    setDataListNoPaing([...data]);
                    let opcUaId = id;
                    if (id) {
                        setOpcId(id);
                        opcUaId = id;
                    } else {
                        setOpcId(data[0].key);//??????????????????
                        opcUaId = data[0].key;
                    }
                    getDeviceBindList({//???????????????????????????
                        terms: {
                            opcUaId: opcUaId
                        },
                        pageSize: 10
                    });
                } else {
                    setDataListNoPaing([]);
                    setResult({});
                    setCurrentPoint({});
                }
            }
            setSpinning(false);
        })
    }

    const getDeviceBindList = (params?: any) => {
        setSpinning(true);
        setSearchParam(params);
        apis.opcUa.getDeviceBindList(encodeQueryParam(params)).then(resp => {
            if (resp.status === 200) {
                setResult(resp.result);
            }
            setSpinning(false);
        })
    }

    const getDevicePointList = (params?: any, devices?: any) => {
        setSpinning(true);
        setSearchPointParam(params);
        apis.opcUa.getDevicePointList(encodeQueryParam(params)).then(resp => {
            if (resp.status === 200) {
                setResultPoint(resp.result);
                if(devices){
                    setDevice(devices);
                    propertiesWs(params.terms.deviceId, resp.result, devices);
                }else{
                    propertiesWs(params.terms.deviceId, resp.result, device);
                }
            }
            setSpinning(false);
        })
    }

    useEffect(() => {
        getListNoPaging(); //?????????
    }, []);

    const statusMap = new Map();
    statusMap.set('??????', 'success');
    statusMap.set('??????', 'error');
    statusMap.set('?????????', 'processing');
    statusMap.set('online', 'success');
    statusMap.set('offline', 'error');
    statusMap.set('notActive', 'processing');
    statusMap.set('enabled', 'success');
    statusMap.set('disabled', 'error');
    statusMap.set('disconnected', 'processing');

    const textPointMap = new Map();
    textPointMap.set('good', '??????');
    textPointMap.set('failed', '??????');
    textPointMap.set('enable', '??????');
    textPointMap.set('disable', '??????');

    const statusPointMap = new Map();
    statusPointMap.set('failed', 'error');
    statusPointMap.set('enable', 'processing');
    statusPointMap.set('good', 'success');
    statusPointMap.set('disable', 'warning');

    const onTableChange = (
        pagination: PaginationConfig,
        filters: any,
    ) => {
        let { terms } = searchParam;
        if (filters.state) {
            if (terms) {
                terms.state = filters.state[0];
            } else {
                terms = {
                    state: filters.state[0],
                };
            }
        }
        getDeviceBindList({
            pageIndex: Number(pagination.current) - 1,
            pageSize: pagination.pageSize,
            terms,
        });
    };

    const onTablePointChange = (
        pagination: PaginationConfig,
        filters: any
    ) => {
        let { terms, sorts } = searchPointParam;
        if (filters.state) {
            if (terms) {
                terms.state = filters.state[0];
            } else {
                terms = {
                    state: filters.state[0]
                };
            }
        }
        setSelectedRowKeys([]);
        getDevicePointList({
            pageIndex: Number(pagination.current) - 1,
            pageSize: pagination.pageSize,
            terms: searchPointParam.terms,
            sorts: sorts,
        });
    };

    const rendertitle = (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ width: '100px', overflow: 'hidden', marginRight: '10px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={() => {
                setOpcId(item.id);
                getDeviceBindList({
                    pageSize: 10,
                    terms: {
                        opcUaId: item.id
                    }
                });
                setPointVisible(false);
            }}>
                <Tooltip title={item.name}>
                    {item.name}
                </Tooltip>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ marginRight: '10px' }} onClick={() => {
                    setCurrentChannel(item);
                    setChannelSaveVisible(true);
                }}><a>??????</a></div>
                <div style={{ marginRight: '10px' }} onClick={() => {
                    setOpcId(item.id);
                    setBindDeviceVisible(true);
                }}><a>????????????</a></div>
                {item.state.value === 'disabled' ?
                    <div style={{ marginRight: '10px' }} onClick={() => {
                        setExpandedKeys([item.id])
                        setSpinning(true);
                        apis.opcUa.start(item.id).then(res => {
                            if (res.status === 200) {
                                getListNoPaging(item.id);
                                message.success('???????????????');
                            }
                            setSpinning(false);
                        })
                    }}><a>??????</a></div> :
                    <div style={{ marginRight: '10px' }} onClick={() => {
                        setExpandedKeys([item.id])
                        setSpinning(true);
                        apis.opcUa.stop(item.id).then(res => {
                            setSpinning(false);
                            getListNoPaging(item.id);
                            message.success('???????????????');
                        })
                    }}><a>??????</a></div>}
                <div style={{ marginRight: '10px' }}>
                    <Popconfirm
                        placement="topRight"
                        title="??????????????????"
                        onConfirm={() => {
                            apis.opcUa.remove(item.id).then(res => {
                                if (res.status === 200) {
                                    getListNoPaging();
                                    setExpandedKeys([]);
                                }
                            })
                        }}
                    >
                        <a>??????</a>
                    </Popconfirm>
                </div>
            </div>
        </div>
    )
    //????????????
    const columns = [
        {
            title: '??????ID',
            align: 'center',
            dataIndex: 'deviceId'
        },
        {
            title: '????????????',
            align: 'center',
            dataIndex: 'name'
        },
        {
            title: '????????????',
            align: 'center',
            dataIndex: 'productName'
        },
        {
            title: '????????????',
            align: 'center',
            dataIndex: 'serverId'
        },
        {
            title: '????????????',
            align: 'center',
            dataIndex: 'state',
            render: (record: any) => record ? <Badge status={statusMap.get(record.value)} text={record.text} /> : '/',
            filters: [
                {
                    text: '??????',
                    value: 'disabled',
                },
                {
                    text: '??????',
                    value: 'enabled',
                },
                {
                    text: '?????????',
                    value: 'disconnected',
                }
            ],
            filterMultiple: false,
        },
        {
            title: '??????',
            align: 'center',
            render: (text: string, record: any) => (
                <Fragment>
                    <a onClick={() => {
                        setBindSaveVisible(true);
                        setCurrentBind(record);
                    }}>??????</a>
                    {record.state.value === 'disabled' ? <>
                        <Divider type="vertical" />
                        <a onClick={() => {
                            apis.opcUa.startBind(record.id).then(res => {
                                if (res.status === 200) {
                                    getDeviceBindList(searchParam);
                                    message.success('???????????????');
                                }
                            })
                        }}>????????????</a>
                        <Divider type="vertical" />
                        <Popconfirm title="???????????????" onConfirm={() => {
                            apis.opcUa.removeBind(record.id).then(res => {
                                if (res.status === 200) {
                                    getDeviceBindList(searchParam);
                                    if (treeNode !== {}) {
                                        onLoadData(treeNode);
                                    }
                                    message.success('???????????????');
                                }
                            })
                        }}>
                            <a>??????</a>
                        </Popconfirm>
                    </> : <>
                        <Divider type="vertical" />
                        <a onClick={() => {
                            apis.opcUa.stopBind(record.id).then(res => {
                                if (res.status === 200) {
                                    getDeviceBindList(searchParam);
                                    message.success('???????????????');
                                }
                            })
                        }}>????????????</a>
                    </>}
                    <Divider type="vertical" />
                    <a onClick={() => {
                        setDeviceId(record.deviceId);
                        setDeviceBindId(record.id);
                        getDevicePointList({
                            pageSize: 10,
                            terms: {
                                deviceId: record.deviceId
                            },
                            sorts: searchPointParam.sorts
                        }, record);
                        setPointVisible(true);
                    }}>????????????</a>
                </Fragment>
            ),
        }
    ];

    const columnsPoint = [
        {
            title: '??????',
            align: 'center',
            width: '120px',
            dataIndex: 'name',
            ellipsis: true,
        },
        {
            title: '??????ID',
            align: 'center',
            width: '100px',
            ellipsis: true,
            dataIndex: 'deviceId'
        },
        {
            title: 'OPC??????ID',
            align: 'center',
            width: '200px',
            ellipsis: true,
            dataIndex: 'opcPointId',
            render: (text: any) => <Tooltip title={text}>{text}</Tooltip>
        },
        {
            title: '????????????',
            width: '100px',
            align: 'center',
            ellipsis: true,
            dataIndex: 'dataMode'
        },
        {
            title: '????????????',
            align: 'center',
            width: '100px',
            ellipsis: true,
            dataIndex: 'dataType'
        },
        {
            title: '???',
            align: 'center',
            width: '100px',
            ellipsis: true,
            dataIndex: 'value',
            render: (text: any) => <Tooltip title={text}>{text}</Tooltip>
        },
        {
            title: '??????',
            align: 'center',
            width: '80px',
            dataIndex: 'state',
            render: (text: any) => <Badge status={statusPointMap.get(text)}
                text={text ? textPointMap.get(text) : '/'} />,
            filters: [
                {
                    text: '??????',
                    value: 'good',
                },
                {
                    text: '??????',
                    value: 'failed',
                },
                {
                    text: '??????',
                    value: 'enable',
                },
                {
                    text: '??????',
                    value: 'disable',
                }
            ],
            filterMultiple: false,
        },
        {
            title: '??????',
            align: 'center',
            width: '80px',
            ellipsis: true,
            dataIndex: 'description'
        },
        {
            title: '??????',
            align: 'center',
            width: '200px',
            render: (text: string, record: any) => (
                <Fragment>
                    <a onClick={() => {
                        setPointSaveVisible(true);
                        setCurrentPoint(record);
                    }}>??????</a>
                    {record.state === 'disable' ?
                        <>
                            <Divider type="vertical" />
                            <a onClick={() => {
                                startPoint([record.id])
                            }}>??????</a>
                        </> :
                        <>
                            <Divider type="vertical" />
                            <a onClick={() => {
                                stopPoint([record.id]);
                            }}>??????</a>
                        </>
                    }
                    <Divider type="vertical" />
                    <Popconfirm
                        placement="topRight"
                        title="??????????????????"
                        onConfirm={() => {
                            apis.opcUa.delPoint(deviceBindId, [record.id]).then(res => {
                                if (res.status === 200) {
                                    getDevicePointList(searchPointParam);
                                }
                            })
                        }}
                    >
                        <a>??????</a>
                    </Popconfirm>
                </Fragment>
            ),
        },
    ];

    const updateTreeData = (list: any[], key: React.Key, children: any[]): any[] => {
        return list.map((node: any) => {
            if (node.key === key) {
                return {
                    ...node,
                    children,
                };
            } else if (node.children) {
                return {
                    ...node,
                    children: updateTreeData(node.children, key, children),
                };
            }
            return node;
        });
    };

    const onLoadData = (treeNode: any) => {
        const { id, isLeaf } = treeNode.props;
        return new Promise<void>(resolve => {
            if (isLeaf) {
                resolve();
                return;
            }
            apis.opcUa.getDeviceBindListNoPaging(encodeQueryParam({
                terms: {
                    opcUaId: id
                }
            })).then(resp => {
                let children1: any[] = [];
                resp.result.map((item: any) => {
                    children1.push({
                        key: item.id,
                        title: item.name,
                        isLeaf: true,
                        id: item.deviceId,
                        item: item,
                        children: []
                    })
                })
                setDataListNoPaing(origin => updateTreeData(origin, id, children1));
                resolve();
            })
        });
    }
    //???????????????????????????????????????
    const onLoadChildrenData = (id: string) => {
        return new Promise<void>(resolve => {
            apis.opcUa.getDeviceBindListNoPaging(encodeQueryParam({
                terms: {
                    opcUaId: id
                }
            })).then(resp => {
                let children1: any[] = [];
                resp.result.map((item: any) => {
                    children1.push({
                        key: item.id,
                        title: item.name,
                        isLeaf: true,
                        id: item.deviceId,
                        item: item,
                        children: []
                    })
                })
                setDataListNoPaing(origin => updateTreeData(origin, id, children1));
                resolve();
            })
        });
    }

    const propertiesWs = (deviceId: string, result: any, device: any) => {
        if (properties$) {
            properties$.unsubscribe();
        }
        let points: any[] = []
        result.data.map((item: any) => {
            points.push(item.property)
        })
        let str = points.join("-");
        let propertiesWs = getWebsocket(
            // `${deviceId}-opc-ua-device-point-value`,
            // `/device/*/${deviceId}/message/property/report`,
            // {},
            // `${deviceId}-opc-ua-device-point-value-${str}`,
            // `/opc-ua-point-value/${deviceId}`,
            // {
            //     points: points
            // }
            `instance-info-property-${deviceId}-${device.productId}-${str}`,
            `/dashboard/device/${device.productId}/properties/realTime`,
            {
                deviceId: deviceId,
                properties: points,
                history: 1,
            },
        ).subscribe((resp: any) => {
            const { payload } = resp;
            let resultList = [...result.data];
            resultList.map((item: any) => {
                // if (payload.properties[item.property] !== undefined) {
                //     item.value = payload.properties[item.property].formatValue
                // }
                if (payload.value.property === item.property) {
                    item.value = payload.value.formatValue
                }
            })
            setResultPoint({
                data: [...resultList],
                pageIndex: result.pageIndex,
                pageSize: result.pageSize,
                total: result.total
            })
        },
            () => { setResultPoint(result) },
            () => { setResultPoint(result) });
        setProperties$(propertiesWs);
    };

    const rowSelection = {
        onChange: (selectedRowKeys: any) => {
            setSelectedRowKeys(selectedRowKeys);
        },
    };

    const stopPoint = (list: any[]) => {
        apis.opcUa.stopPoint(deviceBindId, [...list]).then(res => {
            if (res.status === 200) {
                getDevicePointList(searchPointParam);
            }
        })
    }

    const startPoint = (list: any[]) => {
        apis.opcUa.startPoint(deviceBindId, [...list]).then(res => {
            if (res.status === 200) {
                getDevicePointList(searchPointParam);
            }
        })
    }

    useEffect(() => {
        wsCallback.current = properties$;
    })

    useEffect(() => {
        return () => {
            let properties = wsCallback.current;
            properties && properties.unsubscribe();
        }
    }, []);

    const menu = (
        <Menu>
            <Menu.Item key="1">
                <Button
                    icon="download"
                    type="default"
                    onClick={() => {
                        setExportVisible(true);
                    }}
                >
                    ??????????????????
            </Button>
            </Menu.Item>
            <Menu.Item key="2">
                <Button
                    icon="upload"
                    onClick={() => {
                        setImportVisible(true);
                    }}
                >
                    ??????????????????
            </Button>
            </Menu.Item>
            <Menu.Item key="5">
                <Button icon="check-circle" type="danger" onClick={() => {
                    Modal.confirm({
                        title: `????????????????????????`,
                        okText: '??????',
                        okType: 'primary',
                        cancelText: '??????',
                        onOk() {
                            apis.opcUa.startAllDevice(opcId).then(res => {
                                if (res.status === 200) {
                                    message.success('???????????????');
                                    getDeviceBindList({
                                        terms: {
                                            opcUaId: opcId
                                        },
                                        pageSize: 10
                                    });
                                }
                            })
                        },
                    });
                }}>??????????????????</Button>
            </Menu.Item>
        </Menu>
    );

    return (
        <Spin spinning={spinning}>
            <PageHeaderWrapper title="OPC UA">
                <Card bordered={false}>
                    <div className={style.box}>
                        <Card style={{ width: '350px' }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', margin: '0px 10px 20px 0px' }}>
                                <Button style={{ width: '100%' }} icon="plus" type="dashed" onClick={() => {
                                    setChannelSaveVisible(true);
                                    setCurrentChannel({});
                                }}>??????</Button>
                            </div>
                            <div style={{ width: '320px', height: '650px', overflowY: 'scroll' }}>
                                <Tree
                                    showIcon
                                    treeData={dataListNoPaing}
                                    // loadData={onLoadData}
                                    expandedKeys={expandedKeys}
                                    onExpand={(expandedKeys, { expanded }) => { //???????????????
                                        if (expanded && expandedKeys.length > 0) {
                                            let keys = expandedKeys[expandedKeys.length - 1];
                                            setExpandedKeys([keys])
                                            onLoadChildrenData(keys)
                                        } else {
                                            setExpandedKeys([])
                                        }
                                    }}
                                    onSelect={(key, e) => {
                                        if (key.length > 0) {
                                            setTreeNode(e.node);
                                            const { eventKey, isLeaf, id } = e.node.props;
                                            if (isLeaf) {//??????????????????????????????
                                                setDeviceId(id);
                                                setDeviceBindId(eventKey || key[0]);
                                                getDevicePointList({
                                                    pageSize: 10,
                                                    terms: {
                                                        deviceId: id
                                                    },
                                                    sorts: searchPointParam.sorts
                                                }, e.node.props.item);
                                                setPointVisible(true);
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </Card>
                        <Card style={{ width: 'calc(100% - 360px)' }}>
                            <div className={styles.tableList}>
                                <div className={styles.StandardTable}>
                                    {pointVisible ?
                                        <>
                                            <div style={{ width: '100%' }}>
                                                <SearchForm
                                                    search={(params: any) => {
                                                        getDevicePointList({ terms: { ...params, deviceId: deviceId }, pageSize: 10, sorts: searchPointParam.sorts });
                                                    }}
                                                    formItems={[
                                                        {
                                                            label: 'OPC??????ID',
                                                            key: 'opcPointId$LIKE',
                                                            type: 'string'
                                                        },
                                                        {
                                                            label: '????????????',
                                                            key: 'name$LIKE',
                                                            type: 'string'
                                                        }
                                                    ]}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', marginBottom: '20px', width: '100%' }}>
                                                <div style={{ marginRight: '10px' }}><Button icon="plus" type="primary" onClick={() => {
                                                    setPointSaveVisible(true);
                                                    setCurrentPoint({});
                                                }}>??????</Button></div>
                                                {selectedRowKeys.length > 0 &&
                                                    <>
                                                        <div style={{ marginRight: '10px' }}>
                                                            <Button
                                                                icon="check-circle"
                                                                type="default"
                                                                onClick={() => {
                                                                    startPoint(selectedRowKeys);
                                                                }}
                                                            >
                                                                ??????????????????
                                                            </Button>
                                                        </div>
                                                        <div style={{ marginRight: '10px' }}>
                                                            <Button
                                                                icon="stop"
                                                                type="danger"
                                                                ghost
                                                                onClick={() => {
                                                                    stopPoint(selectedRowKeys);
                                                                }}
                                                            >
                                                                ??????????????????
                                                             </Button>
                                                        </div>
                                                        <div style={{ marginRight: '10px' }}>
                                                            <Button
                                                                icon="check-circle"
                                                                type="danger"
                                                                onClick={() => {
                                                                    apis.opcUa.delPoint(deviceBindId, selectedRowKeys).then(res => {
                                                                        if (res.status === 200) {
                                                                            getDevicePointList(searchPointParam);
                                                                        }
                                                                    })
                                                                }}
                                                            >
                                                                ??????????????????
                                                            </Button>
                                                        </div>
                                                    </>
                                                }
                                            </div>
                                            <Table
                                                loading={props.loading}
                                                dataSource={(resultPoint || {}).data}
                                                columns={columnsPoint}
                                                rowKey="id"
                                                onChange={onTablePointChange}
                                                rowSelection={{
                                                    type: 'checkbox',
                                                    ...rowSelection,
                                                    selectedRowKeys: selectedRowKeys
                                                }}
                                                pagination={{
                                                    current: resultPoint.pageIndex + 1,
                                                    total: resultPoint.total,
                                                    pageSize: resultPoint.pageSize
                                                }}
                                            />
                                        </> :
                                        <>
                                            <div style={{ display: 'flex', marginBottom: '20px', width: '100%', flexWrap: 'wrap' }}>
                                                <div style={{ width: '100%' }}>
                                                    <SearchForm
                                                        search={(params: any) => {
                                                            getDeviceBindList({ terms: { ...params, opcUaId: opcId }, pageSize: 10 });
                                                        }}
                                                        formItems={[
                                                            {
                                                                label: '??????ID',
                                                                key: 'deviceId$LIKE',
                                                                type: 'string'
                                                            },
                                                            // {
                                                            //     label: '????????????',
                                                            //     key: 'name$LIKE',
                                                            //     type: 'string'
                                                            // }
                                                        ]}
                                                    />
                                                </div>
                                                <div style={{ marginRight: '20px' }}><Button type="primary" icon="plus" onClick={() => {
                                                    setBindSaveVisible(true);
                                                    setCurrentBind({});
                                                }}>????????????</Button></div>
                                                <Dropdown overlay={menu}>
                                                    <Button icon="menu">
                                                        ??????????????????
                                                        <Icon type="down" />
                                                    </Button>
                                                </Dropdown>
                                            </div>
                                            <Table
                                                loading={props.loading}
                                                dataSource={(result || {}).data}
                                                columns={columns}
                                                rowKey="id"
                                                onChange={onTableChange}
                                                pagination={{
                                                    current: result.pageIndex + 1,
                                                    total: result.total,
                                                    pageSize: result.pageSize
                                                }}
                                            />
                                        </>}
                                </div>
                            </div>
                        </Card>
                    </div>
                </Card>
                {channelSaveVisible && <ChannelSave data={currentChannel} close={() => {
                    setChannelSaveVisible(false);
                }} save={(data: any) => {
                    setChannelSaveVisible(false);
                    if (currentChannel.id) {
                        apis.opcUa.update(data).then(res => {
                            if (res.status === 200) {
                                message.success('???????????????');
                                getListNoPaging(data.id);
                            }
                        })
                    } else {
                        apis.opcUa.save(data).then(res => {
                            if (res.status === 200) {
                                message.success('???????????????');
                                getListNoPaging(data.id);
                            }
                        })
                    }
                }} />}
                {pointSaveVisible && <PointSave data={currentPoint}
                    deviceId={deviceId}
                    opcUaId={opcId}
                    close={() => {
                        setPointSaveVisible(false);
                    }} save={(data: any) => {
                        setPointSaveVisible(false);
                        apis.opcUa.savePoint(data).then(res => {
                            if (res.status === 200) {
                                message.success('???????????????');
                                getDevicePointList({
                                    pageSize: 10,
                                    terms: {
                                        deviceId: deviceId
                                    },
                                    sorts: searchPointParam.sorts
                                });
                            }
                        })
                    }} />}
                {bindSaveVisible && <BindSave data={currentBind} close={() => {
                    setBindSaveVisible(false);
                }} opcId={opcId} save={() => {
                    setBindSaveVisible(false);
                    if (treeNode !== {}) {
                        onLoadData(treeNode);
                    }
                    getDeviceBindList(searchParam);
                }} />}
                {importVisible && (
                    <Import
                        opcId={opcId}
                        close={() => {
                            setImportVisible(false);
                            if (treeNode !== {}) {
                                onLoadData(treeNode);
                            }
                            getDeviceBindList({
                                pageSize: 10,
                                terms: {
                                    opcUaId: opcId
                                }
                            });
                        }}
                    />
                )}
                {exportVisible && (
                    <Export
                        searchParam={searchParam}
                        close={() => {
                            setExportVisible(false);
                        }}
                    />
                )}
                {bindDeviceVisible && <BindDevice opcId={opcId}
                    close={() => {
                        setBindDeviceVisible(false);
                        if (treeNode !== {}) {
                            onLoadData(treeNode);
                        }
                        getDeviceBindList({
                            pageSize: 10,
                            terms: {
                                opcUaId: opcId
                            }
                        });
                    }} />}
            </PageHeaderWrapper>
        </Spin>
    );
};
export default OpcUaComponent;
