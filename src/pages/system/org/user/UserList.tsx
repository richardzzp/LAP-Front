import {  Alert, Button, Row, Col, Drawer, message, Spin, Form, Input } from 'antd';

import React, { useEffect, useState } from 'react';
import apis from '@/services';
import encodeQueryParam from '@/utils/encodeParam';
import ProTable from '../../permission/component/ProTable';

interface Props {
  close: Function;
  data: any;
  checkedUser: any[];
}
interface State {
  list: {
    pageIndex: number;
    pageSize: number;
    total: number;
    data: any[];
  };
  selectRow: any[];
  loading: boolean;
  keyword: string;
}
const UserList: React.FC<Props> = props => {
  const initState: State = {
    list: {
      pageIndex: 0,
      pageSize: 10,
      total: 0,
      data: [],
    },
    selectRow: [],
    loading: false,
    keyword: '',
  };

  const [list, setList] = useState(initState.list);
  const [selectRow, setSelectRow] = useState(initState.selectRow);
  const [loading, setLoading] = useState(initState.loading);
  const [keyword, setKeyword] = useState(initState.keyword);
  const [searchParam, setSearchParam] = useState<any>({
    terms: {
      'id$in-dimension$org$not': props.data.id,
    },
    pageIndex: 0,
    pageSize: 10,
  });
  const rowSelection = {
    onChange: (selectedRowKeys: any, selectedRows: any) => {
      // setSelectRowKeys();
      setSelectRow(selectedRows);
      // console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
    },
    getCheckboxProps: (record: any) => ({
      disabled: record.name === 'Disabled User', // Column configuration not to be checked
      name: record.name,
    }),
  };

  const handleSearch = (params?: any) => {
    const temp = { ...searchParam, ...params };
    setSearchParam(temp);
    apis.users.list(encodeQueryParam(temp)).then(response => {
      if (response) {
        setList(response.result);
      }
    });
  };

  useEffect(() => {
    // const idList = props.checkedUser.map(i => i.userId).join(',');
    // apis.users.list(encodeQueryParam({
    //   terms: {
    //     id$nin: idList
    //   }
    // })).then(response => {
    //   if (response) {
    //     setList(response.result.data);
    //   }
    // });
    handleSearch();
  }, []);

  // { "dimensionTypeId": "org", "dimensionId": "org1", "dimensionName": "??????1", "userId": "1209763126217355264", "userName": "antd" }
  const bindUser = () => {
    setLoading(true);
    let list: any[] = [];
    selectRow.map(item => {
      list.push(item.id);
    });
    apis.org.bindUserList(props.data.id, list).then(res => {
      if (res.status === 200) {
        message.success('???????????????');
        props.close();
        setLoading(false);
      }
    });
    // selectRow.forEach((item, index) => {
    //   apis.org
    //     .bind({
    //       userId: item.id,
    //       userName: item.username,
    //       dimensionTypeId: props.data.typeId,
    //       dimensionId: props.data.id,
    //       dimensionName: props.data.name,
    //     })
    //     .then(() => {
    //       if (index === selectRow.length - 1) {
    //         message.success('???????????????');
    //         props.close();
    //         setLoading(false);
    //       }
    //     })
    //     .catch(() => {
    //       message.success('???????????????');
    //       setLoading(false);
    //     });
    // });
  };
  return (
    <Drawer visible title="????????????" onClose={() => props.close()} width={800}>
      <Row>
        <Col span={20}>
          <Form.Item label="??????" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
            <Input value={keyword} onChange={e => setKeyword(e.target.value)} />
          </Form.Item>
        </Col>
        <Col span={4} style={{ textAlign: 'center' }}>
          <Button
            type="primary"
            style={{ marginTop: 3 }}
            onClick={() =>
              handleSearch({
                terms: {
                  name$LIKE: keyword,
                },
                // 'username$LIKE@and': keyword,
              })
            }
          >
            ??????
          </Button>
        </Col>
      </Row>
      <Spin spinning={loading}>
        {selectRow.length > 0 && (
          <Row style={{ marginBottom: 10 }}>
            <Col span={20}>
              <Alert message={`?????????${selectRow.length}???`} type="info" showIcon />
            </Col>
            <Col span={1} />
            <Col span={3}>
              <Button
                type="primary"
                onClick={() => {
                  bindUser();
                }}
              >
                ??????
              </Button>
            </Col>
          </Row>
        )}

        <ProTable
          dataSource={list.data}
          paginationConfig={list}
          rowSelection={rowSelection}
          rowKey="id"
          onSearch={(params: any) => {
            handleSearch({ ...params, terms: { ...searchParam.terms, ...params.terms } });
          }}
          columns={[
            {
              dataIndex: 'name',
              title: '??????',
            },
            {
              dataIndex: 'username',
              title: '?????????',
            },
          ]}
        />
      </Spin>
    </Drawer>
  );
};
export default UserList;
