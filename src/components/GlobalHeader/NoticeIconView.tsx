import React, { Component } from 'react';
import { message, notification, Icon, Button } from 'antd';
import { connect } from 'dva';
import groupBy from 'lodash/groupBy';
import moment from 'moment';
import { NoticeItem } from '@/models/global';
import NoticeIcon from '../NoticeIcon';
import { CurrentUser } from '@/models/user';
import { ConnectProps, ConnectState } from '@/models/connect';
import styles from './index.less';
import { getWebsocket } from '@/layouts/GlobalWebSocket';
import Service from '@/pages/account/notification/service';
import encodeQueryParam from '@/utils/encodeParam';
import { router } from 'umi';
import { throttleTime, } from 'rxjs/operators';

export interface GlobalHeaderRightProps extends ConnectProps {
  notices?: NoticeItem[];
  currentUser?: CurrentUser;
  fetchingNotices?: boolean;
  onNoticeVisibleChange?: (visible: boolean) => void;
  onNoticeClear?: (tabName?: string) => void;
}
interface State {
  noticeList: any[];
  loading: boolean;
}
class GlobalHeaderRight extends Component<GlobalHeaderRightProps> {

  state: State = {
    noticeList: [],
    loading: false,
  }



  service = new Service('notifications');
  private ws: any;
  getNotice = () => {
    const { dispatch } = this.props;
    if (dispatch) {
      dispatch({
        type: 'global/fetchNotices',
        payload: encodeQueryParam({
          terms: { state: 'unread' }
        })
      });
    }
  }
  componentDidMount() {
    this.getNotice();
    this.ws = getWebsocket(
      `notification`,
      `/notifications`,
      {}
    ).pipe(
      throttleTime(2000),
    ).subscribe(
      (resp: any) => {
        this.getNotice();
        notification.open({
          message: resp?.payload?.topicName,
          description: resp?.payload?.message,
          key: resp.payload.id,
          top: 60,
          btn: <Button
            type="primary"
            onClick={() => {
              this.service
                .read(resp.payload.id)
                .subscribe(() => {
                  notification.close(resp.payload.id)
                  this.getNotice();
                });
            }}
          >????????????</Button>,
          icon: <Icon type="exclamation-circle" style={{ color: '#E23D38' }} />,
        });
      }
    );

  }

  componentWillUnmount() {
    this.ws.unsubscribe();
  }

  changeReadState = (clickedItem: NoticeItem): void => {
    const { id, state } = clickedItem;
    if (state === 'unread') {
      const { dispatch } = this.props;
      if (dispatch) {
        dispatch({
          type: 'global/changeNoticeReadState',
          payload: id,
        });
      }
    }
  };

  handleNoticeClear = (title: string, key: string) => {
    const { dispatch } = this.props;
    message.success(`${'?????????'} ${title}`);
    const clearIds = (this.getNoticeData().unread || []).map(item => item.id);

    if (dispatch) {
      dispatch({
        type: 'global/clearNotices',
        payload: clearIds,
      });
      // dispatch({
      //   type: 'global/fetchNotices',
      //   payload: encodeQueryParam({
      //     terms: { state: 'unread' }
      //   })
      // });
    }
  };

  getNoticeData = (): {
    [key: string]: NoticeItem[];
  } => {
    const { notices = [] } = this.props;
    if (notices.length === 0) {
      return {};
    }

    const newNotices = notices.map(notice => {
      const newNotice = { ...notice };
      if (newNotice.notifyTime) {
        newNotice.notifyTime = moment(notice.notifyTime as string).fromNow();
      }

      if (newNotice.id) {
        newNotice.key = newNotice.id;
      }

      newNotice.avatar = 'https://gw.alipayobjects.com/zos/rmsportal/fcHMVNCjPOsbUGdEduuv.jpeg';
      newNotice.title = notice.topicName;
      newNotice.description = notice.message;

      return newNotice;
    });

    // console.log(groupBy(newNotices, 'state.value'), 'group-state');
    // return groupBy(newNotices, 'subscriberType');
    return groupBy(newNotices.map(item => ({ ...item, state: item.state.value })), 'state');
  };

  getUnreadData = (noticeData: { [key: string]: NoticeItem[] }) => {
    const unreadMsg: {
      [key: string]: number;
    } = {};
    Object.keys(noticeData).forEach(key => {
      const value = noticeData[key];

      // console.log(key, 'kley');
      if (!unreadMsg[key]) {
        unreadMsg[key] = 0;
      }

      if (Array.isArray(value)) {
        // unreadMsg[key] = value.length;
        // console.log(value, value.filter(item => !item.read).length, key, 'value');
        // unreadMsg[key] = value.filter(item => !item.read).length;
        // unreadMsg[key] = value.filter(item => item.state === 'unread').length;
      }
    });
    return unreadMsg;
  };

  render() {
    const { currentUser, fetchingNotices, onNoticeVisibleChange } = this.props;
    const noticeData = this.getNoticeData();
    const unreadMsg = this.getUnreadData(noticeData);
    return (
      <NoticeIcon
        className={styles.action}
        count={currentUser && currentUser.unreadCount}
        onItemClick={item => {
          this.changeReadState(item as NoticeItem);
        }}
        loading={fetchingNotices}
        clearText="?????????????????????"
        viewMoreText="????????????"
        onClear={this.handleNoticeClear}
        onPopupVisibleChange={onNoticeVisibleChange}
        onViewMore={() => router.push('/account/notification')}
        clearClose
      >
        {/* <NoticeIcon.Tab
          tabKey="notification"
          count={unreadMsg.notification}
          list={noticeData.notification}
          title="??????"
          emptyText="????????????????????????"
          showViewMore
        /> */}

        <NoticeIcon.Tab
          tabKey="read"
          count={unreadMsg.unread}
          list={noticeData.unread}
          title="????????????"
          emptyText="????????????????????????"
          showViewMore
        />
        <NoticeIcon.Tab
          tabKey="handle"
          title="????????????"
          emptyText="????????????"
          count={unreadMsg.handle}
          list={noticeData.handle}
          showViewMore
        />

      </NoticeIcon>
    );
  }
}

export default connect(({ user, global, loading }: ConnectState) => ({
  currentUser: user.currentUser,
  collapsed: global.collapsed,
  fetchingMoreNotices: loading.effects['global/fetchMoreNotices'],
  fetchingNotices: loading.effects['global/fetchNotices'],
  notices: global.notices,
}))(GlobalHeaderRight);
