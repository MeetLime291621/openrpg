import { useEffect, useRef, useState } from 'react';
import { SocketIO } from '../../hooks/useSocket';
import Fade from 'react-bootstrap/Fade';
import Image from 'react-bootstrap/Image';
import styles from '../../styles/modules/Portrait.module.scss';
import { PortraitAttributeStatus } from '../../pages/portrait/[characterID]';
import api from '../../utils/api';

export default function PortraitAvatar(props: {
	attributeStatus: PortraitAttributeStatus;
	playerId: number;
	socket: SocketIO | null;
}) {
	const [src, setSrc] = useState('#');
	const [showAvatar, setShowAvatar] = useState(false);
	const [attributeStatus, setAttributeStatus] = useState(props.attributeStatus);
	const previousStatusID = useRef(0);

	useEffect(() => {
		const id = attributeStatus.find((stat) => stat.value)?.value || 0;
		api
			.get(`/sheet/player/avatar/${id}`, { params: { playerID: props.playerId } })
			.then((res) => setSrc(`${res.data.link}?v=${Date.now()}`))
			.catch(() => setSrc('/avatar404.png'));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const socket = props.socket;
		if (!socket) return;

		socket.on('attributeStatusChange', (playerId, attrStatusID, value) => {
			if (playerId !== props.playerId) return;
			setAttributeStatus((status) => {
				const newAttrStatus = [...status];
				const index = newAttrStatus.findIndex(
					(stat) => stat.attribute_status_id === attrStatusID
				);
				if (index === -1) return status;

				newAttrStatus[index].value = value;

				const newStatusID =
					newAttrStatus.find((stat) => stat.value)?.attribute_status_id || 0;

				if (newStatusID !== previousStatusID.current) {
					previousStatusID.current = newStatusID;
					setShowAvatar(false);
					api
						.get(`/sheet/player/avatar/${newStatusID}`, { params: { playerID: props.playerId } })
						.then((res) => setSrc(`${res.data.link}?v=${Date.now()}`))
						.catch(() => setSrc('/avatar404.png'));
				}

				return newAttrStatus;
			});
		});

		return () => {
			socket.off('attributeStatusChange');
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.socket]);

	return (
		<Fade in={showAvatar}>
			<div>
				<Image
					src={src}
					onError={() => setSrc('/avatar404.png')}
					alt='Avatar'
					onLoad={() => setShowAvatar(true)}
					width={420}
					height={600}
					className={styles.avatar}
				/>
			</div>
		</Fade>
	);
}
