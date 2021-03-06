import { Router } from "express";
import join from './join';
import left from './left';
import { CreateRoomBody, CreateRoomSuccess, GetRoomsResponse } from "./type";
import { ApiRequest, ApiResponse, MQTTMessageTypes } from "../../utils/type";
import RoomManager from "../../class/RoomManager";
import { apiError } from "../../utils/functions";
import { ERROR_CODES, LOBBY_TOPIC } from "../../utils/constants";
import MQTTService from "../../class/MQTTService";

const router = Router();

// Get all rooms
router.get('/', (
  req: ApiRequest<any>,
  res: ApiResponse<GetRoomsResponse>
) => {
  const roomList: GetRoomsResponse = {
    status: 'success',
    data: {
      rooms: RoomManager.getRooms(),
    }
  }
  res.json(roomList);
})
// Create Room
router.post('/', (
  req: ApiRequest<CreateRoomBody>,
  res: ApiResponse<CreateRoomSuccess>
) => {
  const { name, userId } = req.body;
  // check room exist:
  if (RoomManager.checkRoomName(name)) {
    return res.status(400).json({
      status: 'error',
      error: apiError(ERROR_CODES.ROOM_TAKEN),
    });
  } else {
    // Make sure User is existed:
    RoomManager.createRoom(name, userId).then((accessCode: number) => {
      const response: CreateRoomSuccess = { status: 'success', data: { accessCode } };
      res.json(response);

      MQTTService.pub(LOBBY_TOPIC, {
        type: MQTTMessageTypes.NOTIFICATION,
        payload: {
          message: `Some body has created room ${name}`,
        }
      });

    }).catch(error => {
      return res.status(400).json({
        status: 'error',
        error: apiError(ERROR_CODES.USER_NOT_EXIST),
      });
    })
  }
});

router.use('/join', join);
router.use('/left', left);

export default router;
