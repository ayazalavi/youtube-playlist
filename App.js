import { StatusBar } from "expo-status-bar";
import React, { useState, useRef, useEffect } from "react";
import { Router, Scene, Stack, Actions } from "react-native-router-flux";
import { WebView } from "react-native-webview";
import GestureRecognizer from "react-native-swipe-gestures";
import * as ScreenOrientation from "expo-screen-orientation";

import {
	StyleSheet,
	TextInput,
	View,
	FlatList,
	Button,
	Text,
	TouchableOpacity,
	Dimensions,
} from "react-native";

async function changeScreenOrientation(orientation) {
	await ScreenOrientation.lockAsync(orientation);
}

export default function App() {
	return (
		<Router>
			<Stack key="root">
				<Scene key="home" component={Home} />
				<Scene key="player" component={Player} />
			</Stack>
		</Router>
	);
}

const Item = ({ title }) => (
	<View style={styles.item}>
		<Text style={styles.title}>{title}</Text>
	</View>
);

const YoutubeControls = () => {
	return (
		<View
			style={{
				flex: 1,
				flexDirection: "row",
				justifyContent: "space-between",
				position: "absolute",
				alignItems: "center",
				width: "100%",
				height: "100%",
			}}
		>
			<Button
				style={{ width: 50, height: 50 }}
				title="Button 1"
				color="#841584"
				backgroundColor="#fff"
			/>
			<Button
				style={{ width: 50, height: 50 }}
				title="Button 2"
				color="#841584"
				backgroundColor="#fff"
			/>
		</View>
	);
};

function LoadWebview({ youtubeid, play }) {
	const youtubeVid =
		'<iframe id="' +
		youtubeid +
		'" type="text/html" width="100%" height="100%"' +
		'src="https://www.youtube.com/embed/' +
		youtubeid +
		//data[currentVideo].id +
		'?autoplay=1&playsinline=1" frameborder="0"></iframe>';
	const js = `
		var tag = document.createElement('script');
    	tag.src = "https://www.youtube.com/iframe_api";
    	var firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
		
		var player;
		document.getElementById('${youtubeid}').onload = function() {
			onYouTubeIframeAPIReady();
		}
		onYouTubeIframeAPIReady();
		function onYouTubeIframeAPIReady() {
		  player = new YT.Player('${youtubeid}', {
			events: {
			  'onReady': onPlayerReady,
			  'onStateChange': onPlayerStateChange
			}
		  });
		}
		function onPlayerReady(event) {
			if (${play}) {
				alert("play")
				player.playVideo();
			}
			else {
				alert("pause")
				player.pauseVideo();
			}
		}
		function onPlayerStateChange(event) {
			alert(456)
		}
    `;

	const webview = useRef(null);
	const windowWidth = Dimensions.get("window").width;
	const windowHeight = Dimensions.get("window").height;
	return (
		<WebView
			ref={webview}
			startInLoadingState={true}
			mediaPlaybackRequiresUserAction={false}
			userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
			source={{
				html: youtubeVid,
			}}
			bounces={false}
			scalesPageToFit={true}
			allowsInlineMediaPlayback={true}
			automaticallyAdjustContentInsets={false}
			allowsFullscreenVideo={false}
			onLoad={(syntheticEvent) => {
				const { nativeEvent } = syntheticEvent;
				//let youtubeplayer = document.getElementById("ytplayer");
				//alert(youtubeplayer);
				//webview.current.injectJavaScript(js);
			}}
			style={{
				height: windowHeight,
			}}
		/>
	);
}

function Player(props) {
	let data = props.urls;
	//const webview = useRef(null);
	const [currentVideo, setCurrentVideo] = useState(0);
	const config = {
		velocityThreshold: 0.3,
		directionalOffsetThreshold: 80,
	};
	const [showButtons, setShowButtons] = useState(false);
	useEffect(() => {
		// Update the document title using the browser API
		//Orientation.lockToLandscape();
		changeScreenOrientation(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
		return () => ScreenOrientation.unlockAsync();
	});
	const renderItem = ({ item, index }) => {
		return (
			<LoadWebview
				youtubeid={item.id}
				play={index === currentVideo ? true : false}
			/>
		);
	};
	const flatlist = useRef(null);

	const url =
		"https://www.youtube.com/embed/" + data[currentVideo].id + "?autoplay=1";
	return (
		<GestureRecognizer
			onSwipeUp={(state) => {
				if (currentVideo < data.length - 1) {
					setCurrentVideo(currentVideo + 1);
					flatlist.current.scrollToIndex({ index: currentVideo + 1 });
				}
			}}
			onSwipeDown={(state) => {
				if (currentVideo > 0) {
					setCurrentVideo(currentVideo - 1);
					flatlist.current.scrollToIndex({ index: currentVideo - 1 });
				}
			}}
			config={config}
			style={{
				flex: 1,
			}}
		>
			<TouchableOpacity
				style={{ width: "100%", height: "100%" }}
				onPress={(e) => {
					setShowButtons(true);
					setTimeout(() => {
						setShowButtons(false);
					}, 5000);
				}}
			>
				<View
					style={{
						height: "100%",
						flex: 1,
					}}
				>
					<FlatList
						ref={flatlist}
						data={data}
						renderItem={renderItem}
						keyExtractor={(item) => item.id}
					/>
					{showButtons && <YoutubeControls />}
				</View>
				{/* <FlatList
					data={data}
					renderItem={(item) => <LoadWebview youtubeid={item.id} />}
					keyExtractor={(item) => item.id}
					numColumns={1}
				/>
				{showButtons && <YoutubeControls />*/}
			</TouchableOpacity>
		</GestureRecognizer>
	);
}

function Home() {
	const [youtubePlaylist, setYoutubePlaylist] = useState([]);

	const [textInput, setTextInput] = useState("");

	const renderItem = ({ item }) => <Item title={item.url} />;

	const matchYoutubeUrl = (url) => {
		var p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
		if (url.match(p)) {
			return url.match(p)[1];
		}
		return false;
	};

	useEffect(() => {
		// Update the document title using the browser API
		//Orientation.lockToLandscape();
		//changeScreenOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
	});

	const addYoutube = (e) => {
		let id = matchYoutubeUrl(textInput);
		if (id !== false) {
			for (var i = 0; i < youtubePlaylist.length; i++) {
				let item = youtubePlaylist[i];
				if (item.id == id) {
					alert("URL exists already");
					return;
				}
			}
			setYoutubePlaylist([
				...youtubePlaylist,
				{
					id: id,
					url: textInput,
				},
			]);
			setTextInput("");
			//setList(list.push({ id: id, url: textInput }));
		} else {
			alert("Please enter correct youtube URL");
		}
	};

	const start = (e) => {
		if (youtubePlaylist.length > 0) {
			Actions.player({ urls: youtubePlaylist });
		} else {
			alert("Please enter atleast 1 youtube video link");
		}
	};

	return (
		<View style={styles.container}>
			<TextInput
				style={styles.textinput}
				placeholder="Enter youtube URL"
				onChangeText={(text) => setTextInput(text)}
				value={textInput}
			/>
			<Button
				onPress={addYoutube}
				title="Add"
				color="#841584"
				accessibilityLabel="Learn more about this purple button"
			/>
			{youtubePlaylist.length > 0 && (
				<FlatList
					data={youtubePlaylist}
					renderItem={renderItem}
					keyExtractor={(item) => item.id}
					style={styles.list}
				/>
			)}
			{youtubePlaylist.length > 0 && (
				<Button onPress={start} title="Start" color="#841584" />
			)}

			<StatusBar style="auto" />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "column",
		paddingTop: 30,
		paddingHorizontal: 10,
		flex: 1,
	},
	textinput: {
		height: 40,
		borderWidth: 1,
		width: "100%",
		paddingHorizontal: 10,
		marginBottom: 10,
	},
	list: {},
	youtubelist: {
		flex: 1,
		width: "100%",
		height: "100%",
	},
	item: {
		backgroundColor: "#f9c2ff",
		padding: 20,
		marginVertical: 8,
	},
	title: {
		fontSize: 12,
	},
	youtube: {
		flexDirection: "column",
		height: 500,
		width: 500,
	},
	youtubeItem: {
		flex: 1,
	},
});
