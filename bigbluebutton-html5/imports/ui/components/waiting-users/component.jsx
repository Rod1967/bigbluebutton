import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import injectWbResizeEvent from '/imports/ui/components/presentation/resize-wrapper/component';
import UserAvatar from '/imports/ui/components/user-avatar/component';
import TextInput from '/imports/ui/components/text-input/component';
import Styled from './styles';
import { PANELS, ACTIONS } from '../layout/enums';
import Settings from '/imports/ui/services/settings';
import browserInfo from '/imports/utils/browserInfo';

const intlMessages = defineMessages({
  waitingUsersTitle: {
    id: 'app.userList.guest.waitingUsersTitle',
    description: 'Title for the notes list',
  },
  title: {
    id: 'app.userList.guest.waitingUsers',
    description: 'Label for the waiting users',
  },
  optionTitle: {
    id: 'app.userList.guest.optionTitle',
    description: 'Label above the options',
  },
  allowAllAuthenticated: {
    id: 'app.userList.guest.allowAllAuthenticated',
    description: 'Title for the waiting users',
  },
  allowAllGuests: {
    id: 'app.userList.guest.allowAllGuests',
    description: 'Title for the waiting users',
  },
  allowEveryone: {
    id: 'app.userList.guest.allowEveryone',
    description: 'Title for the waiting users',
  },
  denyEveryone: {
    id: 'app.userList.guest.denyEveryone',
    description: 'Title for the waiting users',
  },
  pendingUsers: {
    id: 'app.userList.guest.pendingUsers',
    description: 'Title for the waiting users',
  },
  pendingGuestUsers: {
    id: 'app.userList.guest.pendingGuestUsers',
    description: 'Title for the waiting users',
  },
  noPendingUsers: {
    id: 'app.userList.guest.noPendingUsers',
    description: 'Label for no users waiting',
  },
  rememberChoice: {
    id: 'app.userList.guest.rememberChoice',
    description: 'Remember label for checkbox',
  },
  emptyMessage: {
    id: 'app.userList.guest.emptyMessage',
    description: 'Empty guest lobby message label',
  },
  inputPlaceholder: {
    id: 'app.userList.guest.inputPlaceholder',
    description: 'Placeholder to guest lobby message input',
  },
  accept: {
    id: 'app.userList.guest.acceptLabel',
    description: 'Accept guest button label',
  },
  deny: {
    id: 'app.userList.guest.denyLabel',
    description: 'Deny guest button label',
  },
});

const ALLOW_STATUS = 'ALLOW';
const DENY_STATUS = 'DENY';
const { animations } = Settings.application;

const getNameInitials = (name) => {
  const nameInitials = name.slice(0, 2);

  return nameInitials.replace(/^\w/, (c) => c.toUpperCase());
};

const renderGuestUserItem = (
  name, color, handleAccept, handleDeny, role, sequence, userId, avatar, intl,
) => (
  <Styled.ListItem key={`userlist-item-${userId}`} animations={animations}>
    <Styled.UserContentContainer key={`user-content-container-${userId}`}>
      <Styled.UserAvatarContainer key={`user-avatar-container-${userId}`}>
        <UserAvatar
          key={`user-avatar-${userId}`}
          moderator={role === 'MODERATOR'}
          avatar={avatar}
          color={color}
        >
          {getNameInitials(name)}
        </UserAvatar>
      </Styled.UserAvatarContainer>
      <Styled.UserName key={`user-name-${userId}`}>
        {`[${sequence}] ${name}`}
      </Styled.UserName>
    </Styled.UserContentContainer>

    <Styled.ButtonContainer key={`userlist-btns-${userId}`}>
      <Styled.WaitingUsersButton
        key={`userbtn-accept-${userId}`}
        color="primary"
        size="lg"
        ghost
        label={intl.formatMessage(intlMessages.accept)}
        onClick={handleAccept}
      />
      |
      <Styled.WaitingUsersButton
        key={`userbtn-deny-${userId}`}
        color="primary"
        size="lg"
        ghost
        label={intl.formatMessage(intlMessages.deny)}
        onClick={handleDeny}
      />
    </Styled.ButtonContainer>
  </Styled.ListItem>
);

const renderNoUserWaitingItem = (message) => (
  <Styled.PendingUsers>
    <Styled.NoPendingUsers>
      {message}
    </Styled.NoPendingUsers>
  </Styled.PendingUsers>
);

const renderPendingUsers = (message, usersArray, action, intl) => {
  if (!usersArray.length) return null;
  return (
    <Styled.PendingUsers>
      <Styled.MainTitle>{message}</Styled.MainTitle>
      <Styled.UsersWrapper>
        <Styled.Users>
          {usersArray.map((user, idx) => renderGuestUserItem(
            user.name,
            user.color,
            () => action([user], ALLOW_STATUS),
            () => action([user], DENY_STATUS),
            user.role,
            idx + 1,
            user.intId,
            user.avatar,
            intl,
          ))}
        </Styled.Users>
      </Styled.UsersWrapper>
    </Styled.PendingUsers>
  );
};

const WaitingUsers = (props) => {
  const [rememberChoice, setRememberChoice] = useState(false);

  const {
    intl,
    authenticatedUsers,
    guestUsers,
    guestUsersCall,
    changeGuestPolicy,
    isGuestLobbyMessageEnabled,
    setGuestLobbyMessage,
    guestLobbyMessage,
    authenticatedGuest,
    layoutContextDispatch,
    allowRememberChoice,
  } = props;

  const existPendingUsers = authenticatedUsers.length > 0 || guestUsers.length > 0;

  const closePanel = () => {
    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_IS_OPEN,
      value: false,
    });
    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
      value: PANELS.NONE,
    });
  };

  useEffect(() => {
    const {
      isWaitingRoomEnabled,
    } = props;
    if (!isWaitingRoomEnabled && !existPendingUsers) {
      closePanel();
    }
  });

  const onCheckBoxChange = (e) => {
    const { checked } = e.target;
    setRememberChoice(checked);
  };

  const changePolicy = (shouldExecutePolicy, policyRule, cb) => () => {
    if (shouldExecutePolicy) {
      changeGuestPolicy(policyRule);
    }
    closePanel();
    return cb();
  };

  const renderButton = (message, { key, policy, action }) => (
    <Styled.CustomButton
      key={key}
      color="primary"
      label={message}
      size="lg"
      onClick={changePolicy(rememberChoice, policy, action)}
    />
  );

  const authGuestButtonsData = [
    {
      messageId: intlMessages.allowAllAuthenticated,
      action: () => guestUsersCall(authenticatedUsers, ALLOW_STATUS),
      key: 'allow-all-auth',
      policy: 'ALWAYS_ACCEPT_AUTH',
    },
    {
      messageId: intlMessages.allowAllGuests,
      action: () => guestUsersCall(
        [...guestUsers].concat(rememberChoice ? authenticatedUsers : []),
        ALLOW_STATUS,
      ),
      key: 'allow-all-guest',
      policy: 'ALWAYS_ACCEPT',
    },
  ];

  const guestButtonsData = [
    {
      messageId: intlMessages.allowEveryone,
      action: () => guestUsersCall([...guestUsers, ...authenticatedUsers], ALLOW_STATUS),
      key: 'allow-everyone',
      policy: 'ALWAYS_ACCEPT',
    },
    {
      messageId: intlMessages.denyEveryone,
      action: () => guestUsersCall([...guestUsers, ...authenticatedUsers], DENY_STATUS),
      key: 'deny-everyone',
      policy: 'ALWAYS_DENY',
    },
  ];

  const buttonsData = authenticatedGuest
    ? _.concat(authGuestButtonsData, guestButtonsData)
    : guestButtonsData;

  const { isChrome } = browserInfo;

  return (
    <Styled.Panel data-test="note" isChrome={isChrome}>
      <Styled.Header>
        <Styled.Title data-test="noteTitle">
          <Styled.HideButton
            onClick={() => closePanel()}
            label={intl.formatMessage(intlMessages.title)}
            icon="left_arrow"
          />
        </Styled.Title>
      </Styled.Header>
      <Styled.ScrollableArea>
        {isGuestLobbyMessageEnabled ? (
          <Styled.LobbyMessage>
            <TextInput
              maxLength={128}
              placeholder={intl.formatMessage(intlMessages.inputPlaceholder)}
              send={setGuestLobbyMessage}
            />
            <p>
              <i>
                &quot;
                {
                guestLobbyMessage.length > 0
                  ? guestLobbyMessage
                  : intl.formatMessage(intlMessages.emptyMessage)
              }
                &quot;
              </i>
            </p>
          </Styled.LobbyMessage>
        ) : null}
        {existPendingUsers && (
        <div>
          <div>
            <Styled.MainTitle>{intl.formatMessage(intlMessages.optionTitle)}</Styled.MainTitle>
            {
            buttonsData.map((buttonData) => renderButton(
              intl.formatMessage(buttonData.messageId),
              buttonData,
            ))
          }
          </div>

          {allowRememberChoice ? (
            <Styled.RememberContainer>
              <input id="rememderCheckboxId" type="checkbox" onChange={onCheckBoxChange} />
              <label htmlFor="rememderCheckboxId">
                {intl.formatMessage(intlMessages.rememberChoice)}
              </label>
            </Styled.RememberContainer>
          ) : null}
        </div>
        )}
        {renderPendingUsers(
          intl.formatMessage(intlMessages.pendingUsers,
            { 0: authenticatedUsers.length }),
          authenticatedUsers,
          guestUsersCall,
          intl,
        )}
        {renderPendingUsers(
          intl.formatMessage(intlMessages.pendingGuestUsers,
            { 0: guestUsers.length }),
          guestUsers,
          guestUsersCall,
          intl,
        )}
        {!existPendingUsers && (
          renderNoUserWaitingItem(intl.formatMessage(intlMessages.noPendingUsers))
        )}
      </Styled.ScrollableArea>
    </Styled.Panel>
  );
};

export default injectWbResizeEvent(injectIntl(WaitingUsers));
